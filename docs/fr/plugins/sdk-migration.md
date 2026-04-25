---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous avez utilisé api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche de rétrocompatibilité héritée vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de Plugin
moderne avec des imports ciblés et documentés. Si votre Plugin a été créé avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugins fournissait deux surfaces très ouvertes permettant aux Plugins d’importer
tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines
  d’assistants. Il a été introduit pour maintenir le fonctionnement des anciens Plugins à hooks pendant la construction de la
  nouvelle architecture de Plugin.
- **`openclaw/extension-api`** — un pont donnant aux Plugins un accès direct à
  des assistants côté hôte comme l’exécuteur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook d’extension fourni
  supprimé, limité à Pi, qui pouvait observer des événements d’embedded-runner comme
  `tool_result`.

Ces larges surfaces d’import sont maintenant **obsolètes**. Elles fonctionnent encore à l’exécution,
mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants doivent migrer avant
la prochaine version majeure qui les supprimera. L’API d’enregistrement de fabrique d’extension intégrée limitée à Pi
a été supprimée ; utilisez à la place le middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans le même
changement qui introduit un remplacement. Les changements de contrat cassants doivent d’abord
passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports du SDK, aux champs de manifeste, aux API d’installation, aux hooks et au
comportement d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
  Les enregistrements de fabrique d’extension intégrée limités à Pi ne se chargent déjà plus.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait problème :

- **Démarrage lent** — importer un assistant chargeait des dizaines de modules non liés
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface API floue** — aucun moyen de savoir quels exports étaient stables ou internes

Le SDK Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les coutures pratiques héritées pour fournisseurs de canaux fournis ont également disparu. Des imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les coutures d’assistants brandées par canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats de Plugin stables. Utilisez plutôt des sous-chemins SDK génériques étroits. À l’intérieur de
l’espace de travail des Plugins fournis, gardez les assistants possédés par le fournisseur dans les propres
`api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs fournis :

- Anthropic conserve les assistants de flux spécifiques à Claude dans sa propre couture `api.ts` /
  `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseur, les assistants de modèle par défaut et les constructeurs de fournisseur temps réel
  dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les assistants d’onboarding/config dans son propre
  `api.ts`

## Politique de compatibilité

Pour les Plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. garder l’ancien comportement relié via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

Si un champ de manifeste est encore accepté, les auteurs de Plugins peuvent continuer à l’utiliser jusqu’à
ce que la documentation et les diagnostics indiquent le contraire. Le nouveau code doit préférer le
remplacement documenté, mais les Plugins existants ne doivent pas casser pendant des versions mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les extensions Pi tool-result vers le middleware">
    Les Plugins fournis doivent remplacer les gestionnaires de `api.registerEmbeddedExtensionFactory(...)`
    limités à Pi, qui traitent les résultats d’outil, par un middleware neutre vis-à-vis du runtime.

    ```typescript
    // Outils dynamiques de runtime Pi et Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Mettez aussi à jour le manifeste du Plugin en même temps :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Les Plugins externes ne peuvent pas enregistrer de middleware de résultat d’outil parce qu’il peut
    réécrire une sortie d’outil à forte confiance avant que le modèle ne la voie.

  </Step>

  <Step title="Migrer les gestionnaires approval-native vers les faits de capacité">
    Les Plugins de canal capables d’approbation exposent maintenant le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte runtime.

    Changements clés :

    - Remplacer `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacer l’auth/la distribution spécifiques aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public des Plugins de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste destiné uniquement aux flux login/logout des canaux ; les hooks d’auth
      d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets de runtime possédés par le canal tels que clients, jetons ou apps Bolt
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage possédés par le Plugin depuis les gestionnaires d’approbation natifs ;
      le cœur possède maintenant les avis routed-elsewhere à partir des résultats réels de distribution
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      véritable surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de fallback du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`,
    les wrappers Windows `.cmd`/`.bat` non résolus échouent maintenant en mode fermé sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Définissez ceci uniquement pour des appelants de compatibilité de confiance qui
      // acceptent intentionnellement le fallback médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement d’un fallback shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre Plugin des imports depuis l’une ou l’autre surface obsolète :

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

    // Après (imports modernes ciblés)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les assistants côté hôte, utilisez le runtime de Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres assistants de pont hérités :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | assistants de magasin de sessions | `api.runtime.agent.session.*` |

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
  | Chemin d’import | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant canonique de point d’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport umbrella héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant de point d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants de runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Assistants d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multi-compte | Assistants de liste/configuration/contrôle d’action de compte |
  | `plugin-sdk/account-id` | Assistants d’ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’ID de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + fallback par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte étroits | Assistants de liste de comptes/actions de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitifs d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Primitifs partagés de schéma de configuration de canal ; les exports de schéma nommés par canal fourni ne sont là que pour compatibilité héritée |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation des noms de commande, troncature des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants de cycle de vie du statut de compte et du flux de brouillon | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Assistants de média sortant | Chargement partagé de média sortant |
  | `plugin-sdk/outbound-runtime` | Assistants de runtime sortant | Distribution sortante, délégué d’identité/envoi, session, formatage et assistants de planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fils | Assistants de cycle de vie de liaison de fils et d’adaptateur |
  | `plugin-sdk/agent-media-payload` | Assistants hérités de charge utile média | Builder de charge utile média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires de runtime de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants de runtime larges | Assistants de runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Assistants étroits d’environnement de runtime | Logger/env de runtime, assistants de délai d’expiration, réessai et backoff |
  | `plugin-sdk/plugin-runtime` | Assistants partagés de runtime de Plugin | Assistants de commandes/hooks/http/interactif de Plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hook | Assistants partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Assistants de runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants partagés d’exec |
  | `plugin-sdk/cli-runtime` | Assistants de runtime CLI | Formatage de commande, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway et assistants de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Assistants de configuration | Assistants de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation de commandes Telegram stables en fallback lorsque la surface de contrat Telegram fournie n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Assistants d’invite d’approbation | Charge utile d’approbation exec/plugin, assistants de capacité/profil d’approbation, assistants natifs de routage/runtime d’approbation et formatage structuré du chemin d’affichage d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’auth d’approbation | Résolution des approbateurs, auth d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Assistants de client d’approbation | Assistants de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de distribution d’approbation | Adaptateurs natifs de capacité/distribution d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal chauds |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants de runtime plus larges du gestionnaire d’approbation ; préférez les coutures plus étroites adapter/gateway lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte runtime de canal | Assistants génériques register/get/watch de contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, contrôle DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF | Assistants de liste d’autorisation d’hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants de runtime SSRF | Assistants `pinned-dispatcher`, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de contrôle de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreur |
  | `plugin-sdk/fetch-runtime` | Assistants de fetch/proxy enveloppé | `resolveFetch`, assistants de proxy |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de réessai | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping d’entrée de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Contrôle des commandes et assistants de surface de commande | `resolveControlCommandGate`, assistants d’autorisation d’expéditeur, assistants de registre de commande y compris le formatage dynamique de menu d’arguments |
  | `plugin-sdk/command-status` | Renderers d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Assistants d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Assistants de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde de corps de requête Webhook | Assistants de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime de réponse partagé | Répartition entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de répartition de réponse | Assistants de finalisation, répartition fournisseur et libellés de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage de réponse | Assistants de découpage texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de magasin de session | Assistants de chemin de magasin + `updated-at` |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Builders de résumé d’état canal/compte, valeurs par défaut d’état runtime, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolveur de cible | Assistants partagés de résolveur de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaîne | Assistants de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL chaîne d’entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi à partir des arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemin temporaire | Assistants partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Logger de sous-système et assistants de masquage |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableaux Markdown | Assistants de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de fournisseur local/autohébergé | Assistants de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes assistants de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Assistants d’auth de runtime fournisseur | Assistants de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clé API fournisseur | Assistants d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’auth fournisseur | Builder standard de résultat d’auth OAuth |
  | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive fournisseur | Assistants partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Assistants de sélection de fournisseur | Sélection de fournisseur configuré-ou-auto et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement fournisseur | Assistants de recherche de variables d’environnement d’auth fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/rejeu fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de rejeu, assistants d’endpoint fournisseur et assistants de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’onboarding fournisseur | Assistants de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Assistants HTTP fournisseur | Assistants génériques de capacité HTTP/endpoint fournisseur, y compris les assistants de formulaire multipart pour transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants de récupération web fournisseur | Assistants d’enregistrement/cache de fournisseur de récupération web |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration de recherche web fournisseur | Assistants étroits de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat de recherche web fournisseur | Assistants étroits de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants à portée |
  | `plugin-sdk/provider-web-search` | Assistants de recherche web fournisseur | Assistants d’enregistrement/cache/runtime de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité outil/schéma fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Assistants d’usage fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres assistants d’usage fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’enveloppe de flux fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et assistants d’enveloppe partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport fournisseur | Assistants de transport natif fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File async ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants média partagés | Assistants de récupération/transform/store média plus builders de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération média | Assistants partagés de fallback, sélection de candidats et messages d’absence de modèle pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension média | Types de fournisseur de compréhension média plus exports d’assistants image/audio orientés fournisseur |
  | `plugin-sdk/text-runtime` | Assistants texte partagés | Suppression du texte visible par l’assistant, assistants de rendu/découpage/tableau Markdown, assistants de masquage, assistants de balises de directive, utilitaires de texte sûr, et assistants liés au texte/journalisation |
  | `plugin-sdk/text-chunking` | Assistants de découpage texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants voix | Types de fournisseur de voix plus assistants de directive, registre et validation orientés fournisseur |
  | `plugin-sdk/speech-core` | Cœur de voix partagé | Types de fournisseur de voix, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription temps réel | Types de fournisseur, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants de voix temps réel | Types de fournisseur, assistants de registre/résolution et assistants de session bridge |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, fallback, auth et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, assistants de fallback, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, assistants de fallback, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitifs de configuration de canal | Primitifs étroits de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exports de prélude de Plugin de canal partagé |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants d’édition/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de DM direct | Assistants partagés d’auth/garde de DM direct |
  | `plugin-sdk/extension-shared` | Assistants d’extension partagés | Primitifs d’assistant de canal/statut passif et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cible Webhook | Registre de cible Webhook et assistants d’installation de route |
  | `plugin-sdk/webhook-path` | Assistants de chemin Webhook | Assistants de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Assistants média web partagés | Assistants de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexport Zod | `zod` réexporté pour les consommateurs du SDK Plugin |
  | `plugin-sdk/memory-core` | Assistants fournis de memory-core | Surface d’assistants de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime de moteur mémoire | Façade runtime d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation d’hôte mémoire | Exports du moteur fondation d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings d’hôte mémoire | Contrats d’embeddings mémoire, accès registre, fournisseur local, et assistants génériques batch/distants ; les fournisseurs distants concrets vivent dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD d’hôte mémoire | Exports du moteur QMD d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage d’hôte mémoire | Exports du moteur de stockage d’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux d’hôte mémoire | Assistants multimodaux d’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête d’hôte mémoire | Assistants de requête d’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret d’hôte mémoire | Assistants de secret d’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements d’hôte mémoire | Assistants de journal d’événements d’hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état d’hôte mémoire | Assistants d’état d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI d’hôte mémoire | Assistants de runtime CLI d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur d’hôte mémoire | Assistants de runtime cœur d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/runtime d’hôte mémoire | Assistants fichier/runtime d’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur d’hôte mémoire | Alias neutre vis-à-vis de l’éditeur pour les assistants de runtime cœur d’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias journal d’événements d’hôte mémoire | Alias neutre vis-à-vis de l’éditeur pour les assistants de journal d’événements d’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime d’hôte mémoire | Alias neutre vis-à-vis de l’éditeur pour les assistants fichier/runtime d’hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Assistants Markdown géré | Assistants partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade runtime paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias d’état d’hôte mémoire | Alias neutre vis-à-vis de l’éditeur pour les assistants d’état d’hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Assistants fournis de memory-lancedb | Surface d’assistants memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Assistants et mocks de test |
</Accordion>

Cette table est volontairement le sous-ensemble de migration courant, et non toute la
surface du SDK. La liste complète de plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines coutures d’assistants de Plugins fournis comme
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Ces éléments restent exportés pour la
maintenance et la compatibilité des Plugins fournis, mais ils sont intentionnellement
omis de la table de migration courante et ne constituent pas la cible recommandée pour le
nouveau code de Plugin.

La même règle s’applique à d’autres familles d’assistants fournis telles que :

- assistants de support navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces d’assistants/Plugins fournis comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite d’assistant de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit correspondant à la tâche. Si vous ne trouvez pas un export,
vérifiez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Dépréciations actives

Dépréciations plus étroites qui s’appliquent à travers le SDK Plugin, le contrat de fournisseur,
la surface runtime et le manifeste. Chacune fonctionne encore aujourd’hui mais sera supprimée
dans une future version majeure. L’entrée sous chaque élément associe l’ancienne API à son
remplacement canonique.

<AccordionGroup>
  <Accordion title="builders d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports — simplement importés depuis le sous-chemin plus étroit. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Avant
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Après
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="assistants de contrôle des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` — renvoie un
    objet de décision unique au lieu de deux appels séparés.

    Les Plugins de canal en aval (Slack, Discord, Matrix, Microsoft Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="shim de runtime de canal et assistants d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    Plugins de canal. Ne l’importez pas dans du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer des objets
    de runtime.

    Les assistants `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    obsolètes en même temps que les exports de canal bruts « actions ». Exposez les capacités
    via la surface sémantique `presentation` à la place — les Plugins de canal
    déclarent ce qu’ils rendent (cards, boutons, sélections) plutôt que les noms d’action bruts
    qu’ils acceptent.

  </Accordion>

  <Accordion title="assistant tool() de fournisseur de recherche web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez directement `createTool(...)` sur le Plugin fournisseur.
    OpenClaw n’a plus besoin de l’assistant SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de prompt
    plate en texte brut à partir de messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur. Les
    Plugins de canal attachent les métadonnées de routage (fil, sujet, reply-to, réactions) comme
    des champs typés au lieu de les concaténer dans une chaîne de prompt. L’assistant
    `formatAgentEnvelope(...)` reste pris en charge pour les enveloppes synthétisées visibles par l’assistant,
    mais les enveloppes entrantes en texte brut sont en voie de disparition.

    Zones concernées : `inbound_claim`, `message_received`, et tout Plugin de
    canal personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="types de découverte fournisseur → types de catalogue fournisseur">
    Quatre alias de type de découverte sont maintenant de fines enveloppes au-dessus des
    types de l’ère catalogue :

    | Ancien alias               | Nouveau type              |
    | -------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`   |

    Plus l’ancien sac statique `ProviderCapabilities` — les Plugins fournisseurs
    doivent attacher les faits de capacité via le contrat runtime du fournisseur
    plutôt que via un objet statique.

  </Accordion>

  <Accordion title="hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif, et
    une liste de niveaux ordonnés. OpenClaw rétrograde automatiquement les anciennes valeurs stockées
    selon le rang du profil.

    Implémentez un hook au lieu de trois. Les hooks hérités continuent de fonctionner pendant
    la fenêtre de dépréciation mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="fallback du fournisseur OAuth externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans
    déclarer le fournisseur dans le manifeste du Plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste du Plugin
    **et** implémentez `resolveExternalAuthProfiles(...)`. L’ancien chemin de
    « fallback auth » émet un avertissement à l’exécution et sera supprimé.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="recherche de variable d’environnement fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : répliquez la même recherche de variable d’environnement dans `setup.providers[].envVars`
    dans le manifeste. Cela consolide les métadonnées env de configuration/état en un
    seul endroit et évite de démarrer le runtime du Plugin juste pour répondre à des recherches
    de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="enregistrement de Plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un seul appel sur l’API d’état mémoire —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, appel d’enregistrement unique. Les assistants mémoire additifs
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas concernés.

  </Accordion>

  <Accordion title="types de messages de session de sous-agent renommés">
    Deux alias de type hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                      | Nouveau                        |
    | --------------------------- | ------------------------------ |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    La méthode runtime `readSession` est obsolète au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur TaskFlow vivant.

    **Nouveau** : `runtime.tasks.flows` (pluriel) renvoie un accès TaskFlow basé sur DTO,
    sûr à l’import, qui ne nécessite pas le chargement complet du runtime des tâches.

    ```typescript
    // Avant
    const flow = api.runtime.tasks.flow(ctx);
    // Après
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="fabriques d’extension intégrée → middleware de résultat d’outil d’agent">
    Couvert dans « Comment migrer → Migrer les extensions Pi tool-result vers le
    middleware » ci-dessus. Inclus ici pour exhaustivité : le chemin supprimé limité à Pi
    `api.registerEmbeddedExtensionFactory(...)` est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste explicite de runtimes
    dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est maintenant un
    alias d’une ligne de `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Avant
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Après
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations au niveau extension (à l’intérieur des Plugins de canal/fournisseur fournis sous
`extensions/`) sont suivies dans leurs propres barrels `api.ts` et `runtime-api.ts`.
Elles n’affectent pas les contrats de Plugins tiers et ne sont pas listées
ici. Si vous consommez directement le barrel local d’un Plugin fourni, lisez les
commentaires de dépréciation dans ce barrel avant toute mise à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution       |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins du cœur ont déjà été migrés. Les Plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Lié

- [Premiers pas](/fr/plugins/building-plugins) — créer votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des Plugins de canal
- [Plugins fournisseur](/fr/plugins/sdk-provider-plugins) — créer des Plugins fournisseur
- [Éléments internes des Plugins](/fr/plugins/architecture) — plongée approfondie dans l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) — référence du schéma de manifeste
