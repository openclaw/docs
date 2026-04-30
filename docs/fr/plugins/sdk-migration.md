---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un plugin vers l’architecture moderne des plugins
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez de la couche héritée de compatibilité descendante vers le SDK Plugin moderne
title: Migration du SDK de Plugin
x-i18n:
    generated_at: "2026-04-30T07:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugins moderne avec des imports ciblés et documentés. Si votre plugin a été créé avant la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines d’aides. Il a été introduit pour maintenir le fonctionnement des anciens plugins basés sur des hooks pendant la construction de la nouvelle architecture de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** — un large barrel d’aides d’exécution qui mélangeait événements système, état de Heartbeat, files de livraison, aides fetch/proxy, aides de fichiers, types d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** — un large barrel de compatibilité de configuration qui conserve encore des aides directes de chargement/écriture obsolètes pendant la fenêtre de migration.
- **`openclaw/extension-api`** — une passerelle qui donnait aux plugins un accès direct aux aides côté hôte comme l’exécuteur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook d’extension groupée réservé à Pi, supprimé, qui pouvait observer des événements de l’exécuteur intégré tels que `tool_result`.

Les larges surfaces d’import sont désormais **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant leur suppression dans la prochaine version majeure. L’API d’enregistrement de fabrique d’extension intégrée réservée à Pi a été supprimée ; utilisez plutôt un middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de plugin documenté dans le même changement qui introduit un remplacement. Les changements de contrat incompatibles doivent d’abord passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation. Cela s’applique aux imports du SDK, aux champs de manifeste, aux API de configuration, aux hooks et au comportement d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
  Les enregistrements de fabrique d’extension intégrée réservés à Pi ne se chargent déjà plus.
</Warning>

## Pourquoi ce changement

L’ancienne approche posait problème :

- **Démarrage lent** — importer une aide chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les larges réexports facilitaient la création de cycles d’import
- **Surface d’API floue** — aucun moyen de savoir quels exports étaient stables ou internes

Le SDK de plugins moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome avec un objectif clair et un contrat documenté.

Les anciennes surfaces de commodité pour fournisseurs des canaux groupés ont également disparu.
Les surfaces d’aide marquées par canal étaient des raccourcis privés du mono-dépôt, pas des contrats de plugin stables. Utilisez plutôt des sous-chemins SDK génériques et restreints. Dans l’espace de travail des plugins groupés, conservez les aides détenues par le fournisseur dans le `api.ts` ou le `runtime-api.ts` de ce plugin.

Exemples de fournisseurs groupés actuels :

- Anthropic conserve les aides de flux propres à Claude dans sa propre surface `api.ts` / `contract-api.ts`
- OpenAI conserve les générateurs de fournisseurs, les aides de modèle par défaut et les générateurs de fournisseurs temps réel dans son propre `api.ts`
- OpenRouter conserve le générateur de fournisseur et les aides d’intégration/configuration dans son propre `api.ts`

## Politique de compatibilité

Pour les plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. conserver l’ancien comportement raccordé via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et le remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

Les mainteneurs peuvent auditer la file de migration actuelle avec `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour des décomptes compacts, `--owner <id>` pour un plugin ou propriétaire de compatibilité, et `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des enregistrements de compatibilité arrivés à échéance, des imports SDK réservés entre propriétaires ou des sous-chemins SDK réservés inutilisés. Le rapport regroupe les enregistrements de compatibilité obsolètes par date de suppression, compte les références locales dans le code et la documentation, expose les imports SDK réservés entre propriétaires et résume le pont SDK privé de l’hôte mémoire afin que le nettoyage de compatibilité reste explicite au lieu de reposer sur des recherches ad hoc. Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ; les exports d’aides réservés inutilisés doivent être supprimés du SDK public.

Si un champ de manifeste est encore accepté, les auteurs de plugins peuvent continuer à l’utiliser jusqu’à ce que la documentation et les diagnostics indiquent le contraire. Le nouveau code doit préférer le remplacement documenté, mais les plugins existants ne doivent pas casser pendant les versions mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les aides de chargement/écriture de configuration d’exécution">
    Les plugins groupés doivent cesser d’appeler directement
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)`. Préférez la configuration qui a
    déjà été transmise au chemin d’appel actif. Les gestionnaires de longue durée
    qui ont besoin de l’instantané du processus courant peuvent utiliser `api.runtime.config.current()`. Les outils d’agent de longue durée doivent utiliser `ctx.getRuntimeConfig()` depuis le contexte d’outil dans
    `execute` afin qu’un outil créé avant une écriture de configuration voie encore la configuration d’exécution actualisée.

    Les écritures de configuration doivent passer par les aides transactionnelles et choisir une
    politique après écriture :

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Utilisez `afterWrite: { mode: "restart", reason: "..." }` lorsque l’appelant sait
    que le changement nécessite un redémarrage propre du Gateway, et
    `afterWrite: { mode: "none", reason: "..." }` uniquement lorsque l’appelant possède le
    suivi et veut délibérément supprimer le planificateur de rechargement.
    Les résultats de mutation incluent un résumé `followUp` typé pour les tests et la journalisation ;
    le Gateway reste responsable de l’application ou de la planification du redémarrage.
    `loadConfig` et `writeConfigFile` restent des aides de compatibilité obsolètes
    pour les plugins externes pendant la fenêtre de migration et avertissent une fois avec
    le code de compatibilité `runtime-config-load-write`. Les plugins groupés et le code
    d’exécution du dépôt sont protégés par les garde-fous du scanner dans
    `pnpm check:deprecated-internal-config-api` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation dans un plugin de production
    échoue directement, les écritures directes de configuration échouent, les méthodes serveur du Gateway doivent utiliser
    l’instantané d’exécution de la requête, les aides d’envoi/action/client de canal d’exécution
    doivent recevoir la configuration depuis leur frontière, et les modules d’exécution de longue durée ont
    zéro appel ambiant autorisé à `loadConfig()`.

    Le nouveau code de plugin doit également éviter d’importer le large
    barrel de compatibilité `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin
    SDK restreint qui correspond à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration tels que `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané d’exécution courant | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Aides de magasin de sessions | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Aides d’exécution de politique de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution des entrées secrètes | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les plugins groupés et leurs tests sont protégés par scanner contre le large
    barrel afin que les imports et mocks restent locaux au comportement dont ils ont besoin. Le large
    barrel existe encore pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrer les extensions de résultats d’outil Pi vers le middleware">
    Les plugins groupés doivent remplacer les gestionnaires de résultats d’outil
    `api.registerEmbeddedExtensionFactory(...)` réservés à Pi par un
    middleware neutre vis-à-vis de l’exécution.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Mettez à jour le manifeste du plugin en même temps :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Les plugins externes ne peuvent pas enregistrer de middleware de résultats d’outil, car il peut
    réécrire une sortie d’outil de haute confiance avant que le modèle la voie.

  </Step>

  <Step title="Migrer les gestionnaires natifs d’approbation vers les faits de capacité">
    Les plugins de canal compatibles avec l’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte d’exécution.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste uniquement pour les flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation qui s’y trouvent ne sont plus lus par le noyau
    - Enregistrez les objets d’exécution détenus par le canal, tels que clients, tokens ou applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage détenus par le plugin depuis les gestionnaires d’approbation natifs ;
      le noyau possède désormais les avis de routage ailleurs à partir des résultats de livraison réels
    - Lorsque vous passez `channelRuntime` à `createChannelManager(...)`, fournissez une
      surface réelle `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la disposition actuelle des capacités d’approbation.

  </Step>

  <Step title="Auditer le comportement de secours du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais en mode fermé, sauf si vous passez explicitement
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

    Si votre appelant ne s’appuie pas intentionnellement sur le secours shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre plugin les imports depuis l’une ou l’autre des surfaces obsolètes :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne précis :

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

    Pour les aides côté hôte, utilisez l’exécution de plugin injectée au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres assistants de pont hérités :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | assistants du stockage de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface d’assistants ciblée
    dont il a réellement besoin :

    | Besoin | Import |
    | --- | --- |
    | Assistants de file d’attente d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Assistants d’événements Heartbeat et de visibilité | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file des livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité des canaux | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Assistants de chemins sûrs pour fichiers locaux/médias | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch sensible au dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Assistants de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique de dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de requête/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Assistants de payload de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Assistants de formatage d’erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Assistants de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins groupés sont protégés par scanner contre `infra-runtime`, le code du dépôt
    ne peut donc pas régresser vers le large barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Le nouveau code de routes de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms de clé de route et de cible comparable restent des alias de compatibilité
    pendant la fenêtre de migration, mais les nouveaux plugins doivent utiliser les noms de route
    qui décrivent directement le comportement :

    | Ancien assistant | Assistant moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les assistants de route modernes normalisent `{ channel, to, accountId, threadId }`
    de façon cohérente entre les approbations natives, la suppression des réponses, la déduplication entrante,
    la livraison Cron et le routage des sessions. Si votre plugin possède une grammaire de cible
    personnalisée, utilisez `resolveChannelRouteTargetWithParser(...)` pour adapter ce
    parser au même contrat de cible de route.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Common import path table">
  | Chemin d’importation | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant d’entrée de plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport global hérité pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration | Invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants d’exécution au moment de la configuration | Adaptateurs de correctifs de configuration sûrs à importer, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Assistants d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multicomptes | Assistants de liste de comptes/configuration/barrière d’action |
  | `plugin-sdk/account-id` | Assistants d’ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’ID de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + recours par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte restreints | Assistants de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage par MP | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse, saisie et câblage de livraison de la source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et assistants d’accès aux MP | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration intégrés | Plugins intégrés maintenus par OpenClaw uniquement ; les nouveaux plugins doivent définir des schémas locaux au plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration intégrés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins intégrés maintenus |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation des noms de commandes, suppression des espaces superflus dans les descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de stratégie groupe/MP | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants d’état de compte et de cycle de vie du flux de brouillon | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + générateurs d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Assistants de médias sortants | Chargement partagé de médias sortants |
  | `plugin-sdk/outbound-send-deps` | Assistants de dépendances d’envoi sortant | Recherche légère de `resolveOutboundSendDep` sans importer l’exécution sortante complète |
  | `plugin-sdk/outbound-runtime` | Assistants d’exécution sortante | Assistants de livraison sortante, délégué identité/envoi, session, mise en forme et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fils | Cycle de vie de liaison de fils et assistants d’adaptateur |
  | `plugin-sdk/agent-media-payload` | Assistants de charge utile média hérités | Générateur de charge utile média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires d’exécution de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants d’exécution larges | Assistants d’exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Assistants restreints d’environnement d’exécution | Assistants d’enregistreur/environnement d’exécution, délai d’expiration, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Assistants partagés d’exécution de plugin | Assistants de commandes/hooks/http/interactifs de plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hooks | Assistants partagés de pipeline Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Assistants d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants d’exécution partagés |
  | `plugin-sdk/cli-runtime` | Assistants d’exécution CLI | Mise en forme des commandes, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway, assistant de démarrage prêt pour la boucle d’événements et assistants de correctifs d’état de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilité de configuration obsolète | Préférez `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation des commandes Telegram stables avec recours lorsque la surface contractuelle Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Assistants d’invite d’approbation | Charge utile d’approbation d’exécution/plugin, assistants de capacité/profil d’approbation, assistants de routage/exécution d’approbation native et mise en forme du chemin d’affichage d’approbation structuré |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’autorisation d’approbation | Résolution de l’approbateur, autorisation des actions dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Assistants client d’approbation | Assistants natifs de profil/filtre d’approbation d’exécution |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution de Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants plus larges d’exécution de gestionnaire d’approbation ; préférez les coutures d’adaptateur/Gateway plus restreintes lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation d’exécution/plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte d’exécution de canal | Assistants génériques d’enregistrement/obtention/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, filtrage des MP, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de stratégie SSRF | Assistants de liste d’autorisation d’hôtes et de stratégie de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants d’exécution SSRF | Répartiteur épinglé, récupération protégée, assistants de stratégie SSRF |
  | `plugin-sdk/system-event-runtime` | Assistants d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Assistants Heartbeat | Assistants d’événement Heartbeat et de visibilité |
  | `plugin-sdk/delivery-queue-runtime` | Assistants de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Assistants d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Assistants de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Assistants d’accès aux fichiers | Assistants sûrs de chemins de fichier local/média |
  | `plugin-sdk/transport-ready-runtime` | Assistants de disponibilité du transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de filtrage de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de mise en forme des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants de fetch/proxy enveloppés | `resolveFetch`, assistants de proxy, assistants d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de stratégie |
  | `plugin-sdk/allow-from` | Mise en forme de la liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage des entrées de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Assistants de filtrage des commandes et de surface de commandes | `resolveControlCommandGate`, assistants d’autorisation de l’expéditeur, assistants de registre de commandes incluant la mise en forme du menu d’arguments dynamiques |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées de secrets | Assistants d’entrée de secrets |
  | `plugin-sdk/webhook-ingress` | Assistants de requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde du corps Webhook | Assistants de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Répartition entrante, Heartbeat, planificateur de réponses, découpage en morceaux |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants restreints de répartition des réponses | Finalisation, répartition au fournisseur et assistants d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage des réponses | Assistants de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de stockage des sessions | Chemin de stockage + assistants de date de mise à jour |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Générateurs de résumé d’état de canal/compte, valeurs par défaut de l’état d’exécution, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolveur de cible | Assistants partagés de résolveur de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaînes | Assistants de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL de chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commandes temporisées | Exécuteur de commandes temporisées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charges utiles d’outils | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemins temporaires | Assistants partagés de chemins de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Assistants de journalisation de sous-système et de caviardage |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableaux Markdown | Assistants de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse aux messages | Types de charges utiles de réponse |
  | `plugin-sdk/provider-setup` | Assistants organisés de configuration de fournisseurs locaux/auto-hébergés | Assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI | Mêmes assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Assistants d’authentification d’exécution des fournisseurs | Assistants de résolution de clés d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clés d’API de fournisseur | Assistants d’intégration/d’écriture de profil pour clés d’API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive de fournisseur | Assistants partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Assistants de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement de fournisseur | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de règles de relecture, assistants de points de terminaison de fournisseur et assistants de normalisation d’identifiants de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue de fournisseurs | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Assistants de configuration d’intégration |
  | `plugin-sdk/provider-http` | Assistants HTTP de fournisseur | Assistants génériques de capacités HTTP/point de terminaison de fournisseur, y compris les assistants de formulaires multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants web-fetch de fournisseur | Assistants d’enregistrement/cache de fournisseurs web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration de recherche web de fournisseur | Assistants ciblés de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat de recherche web de fournisseur | Assistants ciblés de contrat de configuration/identifiants de recherche web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et accesseurs de définition/lecture d’identifiants délimités |
  | `plugin-sdk/provider-web-search` | Assistants de recherche web de fournisseur | Assistants d’enregistrement/cache/exécution de fournisseurs de recherche web |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité d’outils/schémas de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Assistants d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres assistants d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants partagés d’enveloppe Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur | Assistants de transport natif de fournisseur, tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants média partagés | Assistants de récupération/transformation/stockage de médias, sondage des dimensions vidéo basé sur ffprobe et générateurs de charges utiles média |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération de médias | Assistants partagés de bascule, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension des médias | Types de fournisseurs de compréhension des médias, plus exports d’assistants image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Assistants de texte partagés | Suppression du texte visible par l’assistant, assistants de rendu/découpage/tableaux Markdown, assistants de caviardage, assistants de balises de directive, utilitaires de texte sûr et assistants associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Assistants de découpage de texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants vocaux | Types de fournisseurs vocaux, plus assistants de directives, registre et validation destinés aux fournisseurs, et générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription en temps réel | Types de fournisseurs, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants vocaux en temps réel | Types de fournisseurs, assistants de registre/résolution et assistants de sessions de pont |
  | `plugin-sdk/image-generation` | Assistants de génération d’images | Types de fournisseurs de génération d’images, plus assistants de ressources image/URL de données et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, bascule, authentification et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération de musique | Types de fournisseurs/requêtes/résultats de génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, assistants de bascule, recherche de fournisseur et analyse de références de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération de vidéos | Types de fournisseurs/requêtes/résultats de génération de vidéos |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération de vidéos | Types de génération de vidéos, assistants de bascule, recherche de fournisseur et analyse de références de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction des charges utiles de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports de préambule de Plugin de canal partagé |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de DM direct | Assistants partagés d’authentification/protection pour DM direct |
  | `plugin-sdk/extension-shared` | Assistants d’extension partagés | Primitives d’assistants de canal passif/état et proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cibles Webhook | Registre de cibles Webhook et assistants d’installation de routes |
  | `plugin-sdk/webhook-path` | Assistants de chemins Webhook | Assistants de normalisation de chemins Webhook |
  | `plugin-sdk/web-media` | Assistants média web partagés | Assistants de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport Zod | `zod` réexporté pour les consommateurs du SDK de Plugin |
  | `plugin-sdk/memory-core` | Assistants memory-core groupés | Surface d’assistants de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’indexation/recherche de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte de mémoire | Exports du moteur de fondation de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte de mémoire | Contrats d’embeddings de mémoire, accès au registre, fournisseur local et assistants génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte de mémoire | Exports du moteur QMD de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte de mémoire | Exports du moteur de stockage de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte de mémoire | Assistants multimodaux de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte de mémoire | Assistants de requête de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte de mémoire | Assistants de secret de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte de mémoire | Assistants de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte de mémoire | Assistants d’état de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte de mémoire | Assistants d’exécution CLI de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution du noyau de l’hôte de mémoire | Assistants d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers/exécution de l’hôte de mémoire | Assistants de fichiers/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias de l’exécution du noyau de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias du journal d’événements de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichiers/exécution de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants de fichiers/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-markdown` | Assistants Markdown gérés | Assistants partagés de Markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche active-memory |
  | `plugin-sdk/memory-host-status` | Alias d’état de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants d’état de l’hôte de mémoire |
  | `plugin-sdk/testing` | Utilitaires de test | Barillet de compatibilité large hérité ; préférez les sous-chemins de test ciblés tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau est intentionnellement le sous-ensemble de migration commun, et non la
surface complète du SDK. La liste complète de plus de 200 points d’entrée se
trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les points d’extension d’aide réservés aux Plugins groupés ont été retirés de
la carte d’export du SDK public, à l’exception des façades de compatibilité
explicitement documentées comme le shim obsolète `plugin-sdk/discord` conservé
pour le paquet publié `@openclaw/discord@2026.3.13`. Les aides propres à un
propriétaire vivent dans le paquet du Plugin propriétaire ; le comportement
partagé de l’hôte doit passer par des contrats SDK génériques comme
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
`plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus étroit qui correspond à la tâche. Si vous ne trouvez
pas d’export, consultez la source dans `src/plugin-sdk/` ou demandez aux
mainteneurs quel contrat générique doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent au SDK de Plugin, au contrat de
fournisseur, à la surface runtime et au manifeste. Chacune fonctionne encore
aujourd’hui, mais sera supprimée dans une future version majeure. L’entrée sous
chaque élément associe l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="constructeurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures,
    mêmes exports — simplement importés depuis le sous-chemin plus étroit.
    `command-auth` les réexporte comme stubs de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Aides de filtrage des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` — renvoie
    un seul objet de décision au lieu de deux appels séparés.

    Les Plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Shim runtime de canal et aides d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les
    anciens Plugins de canal. Ne l’importez pas depuis le nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    runtime.

    Les aides `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    obsolètes, tout comme les exports de canal "actions" bruts. Exposez plutôt
    les capacités via la surface sémantique `presentation` — les Plugins de
    canal déclarent ce qu’ils rendent (cartes, boutons, sélecteurs) plutôt que
    les noms d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Aide tool() de fournisseur de recherche Web → createTool() sur le Plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le Plugin
    fournisseur. OpenClaw n’a plus besoin de l’aide SDK pour enregistrer le
    wrapper de l’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe
    d’invite plate en texte brut à partir des messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs de contexte utilisateur
    structurés. Les Plugins de canal attachent les métadonnées de routage
    (fil, sujet, réponse à, réactions) comme champs typés au lieu de les
    concaténer dans une chaîne d’invite. L’aide `formatAgentEnvelope(...)` reste
    prise en charge pour les enveloppes synthétisées destinées à l’assistant,
    mais les enveloppes entrantes en texte brut sont en voie de retrait.

    Zones concernées : `inbound_claim`, `message_received` et tout Plugin de
    canal personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="Types de découverte de fournisseur → types de catalogue de fournisseur">
    Quatre alias de types de découverte sont désormais de fins wrappers autour
    des types de l’ère du catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus l’ancien conteneur statique `ProviderCapabilities` — les Plugins
    fournisseurs doivent utiliser des hooks de fournisseur explicites comme
    `buildReplayPolicy`, `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un
    objet statique.

  </Accordion>

  <Accordion title="Hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks distincts sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et
    une liste de niveaux ordonnée. OpenClaw rétrograde automatiquement les
    valeurs stockées obsolètes selon le rang du profil.

    Implémentez un hook au lieu de trois. Les anciens hooks continuent de
    fonctionner pendant la fenêtre de dépréciation, mais ne sont pas composés
    avec le résultat du profil.

  </Accordion>

  <Accordion title="Repli de fournisseur OAuth externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans déclarer
    le fournisseur dans le manifeste du Plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste
    du Plugin **et** implémentez `resolveExternalAuthProfiles(...)`. L’ancien
    chemin de "repli d’authentification" émet un avertissement à l’exécution et
    sera supprimé.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Recherche de variables d’environnement fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : répliquez la même recherche de variable d’environnement dans
    `setup.providers[].envVars` sur le manifeste. Cela consolide les
    métadonnées d’environnement de configuration/statut en un seul endroit et
    évite de démarrer le runtime du Plugin juste pour répondre aux recherches
    de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de
    compatibilité jusqu’à la fin de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement de Plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API d’état mémoire —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les aides mémoire
    additives (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas affectées.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux anciens alias de types sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                       | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode runtime `readSession` est obsolète au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur de
    flux de tâches actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve le runtime de mutation
    TaskFlow géré pour les Plugins qui créent, mettent à jour, annulent ou
    exécutent des tâches enfants depuis un flux. Utilisez `runtime.tasks.flows`
    lorsque le Plugin n’a besoin que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabriques d’extensions intégrées → middleware de résultats d’outils d’agent">
    Couvert dans "Comment migrer → Migrer les extensions de résultats d’outils
    Pi vers le middleware" ci-dessus. Inclus ici par souci d’exhaustivité : le
    chemin supprimé réservé à Pi `api.registerEmbeddedExtensionFactory(...)`
    est remplacé par `api.registerAgentToolResultMiddleware(...)` avec une liste
    runtime explicite dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est désormais
    un alias d’une ligne pour `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations au niveau des extensions (dans les Plugins de canal/fournisseur
groupés sous `extensions/`) sont suivies dans leurs propres barrels `api.ts` et
`runtime-api.ts`. Elles n’affectent pas les contrats des Plugins tiers et ne
sont pas listées ici. Si vous consommez directement le barrel local d’un Plugin
groupé, lisez les commentaires de dépréciation dans ce barrel avant la mise à
niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution        |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins principaux ont déjà été migrés. Les Plugins externes doivent
migrer avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une issue de secours temporaire, pas d’une solution permanente.

## Connexe

- [Bien démarrer](/fr/plugins/building-plugins) — créez votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des Plugins de canal
- [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins) — créer des Plugins fournisseurs
- [Internes des Plugins](/fr/plugins/architecture) — exploration approfondie de l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) — référence du schéma de manifeste
