---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un plugin vers l’architecture moderne des plugins
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK de Plugin moderne
title: Migration du SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T15:38:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw a remplacé une vaste couche de rétrocompatibilité par une architecture
de plugins moderne fondée sur de petits imports ciblés. Si votre plugin est
antérieur à ce changement, ce guide vous aide à adopter les contrats actuels.

## Ce qui a changé

Deux surfaces d’import très permissives permettaient auparavant aux plugins
d’accéder à presque tout depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** - réexportait des dizaines d’utilitaires pour
  maintenir le fonctionnement des anciens plugins fondés sur des hooks pendant
  la construction de la nouvelle architecture.
- **`openclaw/plugin-sdk/infra-runtime`** - un vaste module d’agrégation mêlant
  événements système, état Heartbeat, files d’attente de livraison, utilitaires
  de récupération/proxy, utilitaires de fichiers, types d’approbation et
  utilitaires sans rapport entre eux.
- **`openclaw/plugin-sdk/config-runtime`** - un vaste module d’agrégation de
  configuration qui contenait encore des utilitaires directs obsolètes de
  chargement/écriture pendant la période de migration.
- **`openclaw/extension-api`** - une passerelle donnant aux plugins un accès
  direct aux utilitaires côté hôte, comme l’exécuteur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook supprimé, propre à
  l’exécuteur intégré, qui observait ses événements tels que `tool_result`.
  Utilisez plutôt l’intergiciel de résultats d’outils d’agent (voir
  [Migrer les extensions de résultats d’outils intégrées vers
  l’intergiciel](#how-to-migrate)).

Ces surfaces sont **obsolètes** : elles fonctionnent encore, mais les nouveaux
plugins ne doivent pas les utiliser et les plugins existants doivent migrer
avant leur suppression dans la prochaine version majeure.
`registerEmbeddedExtensionFactory` a déjà été supprimé ; les anciens
enregistrements ne sont plus chargés.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version
  majeure. Les plugins qui importent encore depuis ces surfaces cesseront alors
  de fonctionner.
</Warning>

OpenClaw ne supprime ni ne réinterprète un comportement de plugin documenté dans
le même changement que celui qui introduit son remplacement. Les modifications
de contrat incompatibles passent d’abord par un adaptateur de compatibilité, des
diagnostics, de la documentation et une période d’obsolescence. Cela s’applique
aux imports du SDK, aux champs du manifeste, aux API de configuration, aux hooks
et au comportement d’enregistrement à l’exécution.

### Pourquoi

- **Démarrage lent** - l’import d’un seul utilitaire chargeait des dizaines de
  modules sans rapport.
- **Dépendances circulaires** - les vastes réexportations facilitaient la
  création de cycles d’import.
- **Surface d’API peu claire** - rien ne permettait de distinguer les exports
  stables des exports internes.

Chaque `openclaw/plugin-sdk/<subpath>` est désormais un petit module autonome
doté d’un contrat documenté.

Les anciennes interfaces pratiques de fournisseurs pour les canaux intégrés ont
également disparu : les raccourcis d’utilitaires propres aux canaux étaient des
commodités privées du monorepo, et non des contrats de plugin stables. Utilisez
plutôt des sous-chemins génériques et ciblés du SDK. Dans l’espace de travail
des plugins intégrés, conservez les utilitaires appartenant au fournisseur dans
le fichier `api.ts` ou `runtime-api.ts` de ce plugin :

- Anthropic conserve les utilitaires de flux propres à Claude dans son
  interface `api.ts` / `contract-api.ts`.
- OpenAI conserve les constructeurs de fournisseurs, les utilitaires de modèle
  par défaut et les constructeurs de fournisseurs en temps réel dans son
  fichier `api.ts`.
- OpenRouter conserve le constructeur de fournisseur et les utilitaires
  d’intégration/configuration dans son fichier `api.ts`.

## Politique de compatibilité

Les travaux de compatibilité des plugins externes suivent cet ordre :

1. Ajouter le nouveau contrat.
2. Maintenir l’ancien comportement au moyen d’un adaptateur de compatibilité.
3. Émettre un diagnostic ou un avertissement indiquant l’ancien chemin et son
   remplacement.
4. Couvrir les deux chemins dans les tests.
5. Documenter l’obsolescence et la procédure de migration.
6. Ne supprimer qu’après la période de migration annoncée, généralement dans
   une version majeure.

Si un champ de manifeste est encore accepté, continuez à l’utiliser jusqu’à ce
que la documentation et les diagnostics indiquent le contraire. Le nouveau code
doit privilégier le remplacement documenté ; les plugins existants ne doivent
pas cesser de fonctionner lors de versions mineures ordinaires.

Auditez la file de migration actuelle avec `pnpm plugins:boundary-report` :

| Option                                                  | Effet                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (ou `pnpm plugins:boundary-report:summary`) | Décomptes compacts au lieu des détails complets.                               |
| `--json`                                                | Rapport lisible par une machine.                                               |
| `--owner <id>`                                          | Filtre sur un seul plugin ou propriétaire de compatibilité.                    |
| `--fail-on-cross-owner`                                 | Renvoie un code différent de zéro pour les imports SDK réservés entre propriétaires. |
| `--fail-on-eligible-compat`                             | Renvoie un code différent de zéro lorsque la date `removeAfter` d’un enregistrement de compatibilité obsolète est dépassée. |
| `--fail-on-unclassified-unused-reserved`                | Renvoie un code différent de zéro pour les interfaces SDK réservées, inutilisées et non classées. |

`pnpm plugins:boundary-report:ci` s’exécute avec les trois options d’échec.
Chaque enregistrement de compatibilité possède une date `removeAfter` explicite
(et non une vague « prochaine version majeure ») : le rapport regroupe les
enregistrements obsolètes selon cette date, compte les références locales dans
le code et la documentation, signale les imports SDK réservés entre
propriétaires et résume la passerelle SDK privée de l’hôte de mémoire. Les
sous-chemins SDK réservés doivent être associés à un usage suivi par leur
propriétaire ; les exports réservés inutilisés doivent être supprimés du SDK
public.

## Procédure de migration

<Steps>
  <Step title="Migrer les utilitaires de chargement/écriture de la configuration d’exécution">
    Les plugins intégrés doivent cesser d’appeler directement
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)`. Privilégiez la configuration
    déjà transmise au chemin d’appel actif. Les gestionnaires à longue durée de
    vie qui ont besoin de l’instantané actuel du processus peuvent utiliser
    `api.runtime.config.current()`. Les outils d’agent à longue durée de vie
    doivent lire `ctx.getRuntimeConfig()` dans `execute`, afin qu’un outil créé
    avant une écriture de configuration voie tout de même la configuration
    actualisée.

    Les écritures de configuration passent par l’utilitaire transactionnel avec
    une politique explicite après écriture :

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Utilisez `afterWrite: { mode: "restart", reason: "..." }` lorsque le
    changement nécessite un redémarrage propre du Gateway, et
    `afterWrite: { mode: "none", reason: "..." }` uniquement lorsque l’appelant
    prend en charge la suite et désactive délibérément le planificateur de
    rechargement. Les résultats de mutation incluent un résumé `followUp` typé
    pour les tests et la journalisation ; le Gateway reste responsable de
    l’application ou de la planification du redémarrage.

    `loadConfig` et `writeConfigFile` restent disponibles comme utilitaires de
    compatibilité obsolètes pour les plugins externes et émettent un
    avertissement unique avec le code de compatibilité
    `runtime-config-load-write`. Les plugins intégrés et le code d’exécution du
    dépôt sont protégés par `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation
    dans le code de production d’un plugin échoue immédiatement, les écritures
    directes de configuration échouent, les méthodes du serveur Gateway doivent
    utiliser l’instantané d’exécution de la requête, les utilitaires d’envoi,
    d’action et de client des canaux d’exécution doivent recevoir la
    configuration depuis leur frontière, et les modules d’exécution à longue
    durée de vie n’autorisent aucun appel ambiant à `loadConfig()`.

    Le nouveau code de plugin doit éviter le vaste module d’agrégation
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin ciblé
    correspondant au besoin :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration tels que `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions sur une configuration déjà chargée et recherche de configuration à l’entrée d’un plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lecture de l’instantané d’exécution actuel | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Utilitaires du magasin de sessions | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration des tableaux Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Utilitaires d’exécution des politiques de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution des entrées secrètes | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les plugins intégrés et leurs tests sont protégés par une analyse contre ce
    vaste module d’agrégation, afin que les imports et les simulations restent
    locaux au comportement dont ils ont besoin. Le module d’agrégation existe
    toujours pour la compatibilité externe, mais le nouveau code ne doit pas en
    dépendre.

  </Step>

  <Step title="Migrer les extensions de résultats d’outils intégrées vers l’intergiciel">
    Les plugins intégrés doivent remplacer les gestionnaires de résultats
    d’outils propres à l’exécuteur intégré
    `api.registerEmbeddedExtensionFactory(...)` par un intergiciel indépendant
    de l’environnement d’exécution :

    ```typescript
    // Outils dynamiques des environnements d’exécution OpenClaw et Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Mettez à jour le manifeste du plugin en même temps :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Les plugins installés peuvent également enregistrer un intergiciel de
    résultats d’outils lorsqu’il est explicitement activé et que chaque
    environnement d’exécution ciblé est déclaré dans
    `contracts.agentToolResultMiddleware`. Les enregistrements d’intergiciels
    installés non déclarés sont rejetés.

  </Step>

  <Step title="Migrer les gestionnaires d’approbation natifs vers les faits de capacité">
    Les plugins de canaux prenant en charge les approbations exposent le
    comportement d’approbation natif au moyen de
    `approvalCapability.nativeRuntime` et du registre partagé de contexte
    d’exécution :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`.
    - Déplacez l’authentification et la livraison propres aux approbations hors
      de l’ancien câblage `plugin.auth` / `plugin.approvals` vers
      `approvalCapability`.
    - `ChannelPlugin.approvals` a été supprimé du contrat public des plugins de
      canaux ; déplacez les champs de livraison, natifs et de rendu vers
      `approvalCapability`.
    - `plugin.auth` ne sert plus qu’aux flux de connexion/déconnexion des
      canaux ; le cœur n’y lit plus les hooks d’authentification des
      approbations.
    - Enregistrez les objets d’exécution appartenant au canal (clients, jetons,
      applications Bolt) au moyen de
      `openclaw/plugin-sdk/channel-runtime-context`.
    - N’envoyez pas de notifications de réacheminement appartenant au plugin
      depuis les gestionnaires d’approbation natifs ; le cœur gère les
      notifications d’acheminement vers un autre emplacement à partir des
      résultats de livraison réels.
    - Lorsque vous transmettez `channelRuntime` à
      `createChannelManager(...)`, fournissez une véritable surface
      `createPluginRuntime().channel` ; les simulations partielles sont
      rejetées.

    Consultez [Plugins de canaux](/fr/plugins/sdk-channel-plugins) pour connaître
    la structure actuelle des capacités d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli des wrappers Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers
    Windows `.cmd`/`.bat` non résolus échouent désormais de manière fermée, sauf
    si vous transmettez explicitement `allowShellFallback: true` :

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Définissez ceci uniquement pour les appelants de compatibilité de
      // confiance qui acceptent intentionnellement un repli via le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli via le shell,
    ne définissez pas `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Rechercher les imports obsolètes">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="Les remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne
    spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité obsolète)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Après (imports modernes et ciblés)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les fonctions auxiliaires côté hôte, utilisez l’environnement d’exécution
    du plugin injecté au lieu d’effectuer une importation directe :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // Après (environnement d’exécution injecté)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Appliquez le même modèle aux autres fonctions auxiliaires de pont héritées :

    | Ancienne importation | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | fonctions auxiliaires du stockage de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Remplacer les importations générales d’infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour assurer la
    compatibilité externe, mais le nouveau code doit importer la surface ciblée
    dont il a réellement besoin :

    | Besoin | Importation |
    | --- | --- |
    | Fonctions auxiliaires de la file d’attente des événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Fonctions auxiliaires de réveil, d’événement et de visibilité du Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file d’attente des livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie de l’activité des canaux | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire et adossés à un stockage persistant | `openclaw/plugin-sdk/dedupe-runtime` |
    | Fonctions auxiliaires sécurisées pour les chemins de fichiers locaux et de médias | `openclaw/plugin-sdk/file-access-runtime` |
    | Récupération tenant compte du répartiteur | `openclaw/plugin-sdk/runtime-fetch` |
    | Fonctions auxiliaires de récupération avec proxy et protections | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de stratégie du répartiteur SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande et de résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Charge utile de réponse d’approbation et fonctions auxiliaires de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Fonctions auxiliaires de mise en forme des erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Fonctions auxiliaires sécurisées pour les jetons | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence limitée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Assertions de valeurs requises pour les invariants démontrables | `openclaw/plugin-sdk/expect-runtime` |
    | Conversion numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Un analyseur empêche les plugins intégrés d’utiliser `infra-runtime`, afin
    que le code du dépôt ne puisse pas revenir à ce barrel général.

  </Step>

  <Step title="Migrer les fonctions auxiliaires de routage des canaux">
    Le nouveau code de routage des canaux utilise `openclaw/plugin-sdk/channel-route`.
    Les anciens noms de clés de routage et de cibles comparables restent disponibles
    comme alias de compatibilité :

    | Ancienne fonction auxiliaire | Fonction auxiliaire moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les fonctions auxiliaires de routage modernes normalisent
    `{ channel, to, accountId, threadId }` de manière cohérente pour les
    approbations natives, la suppression des réponses, la déduplication des
    messages entrants, la livraison Cron et le routage des sessions.

    N’ajoutez pas de nouvelles utilisations de
    `ChannelMessagingAdapter.parseExplicitTarget`, des fonctions auxiliaires de
    routage chargé reposant sur l’analyseur (`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` provenant de
    `plugin-sdk/channel-route` : elles sont obsolètes et ne subsistent que pour
    les anciens plugins. Les nouveaux plugins de canal doivent utiliser
    `messaging.targetResolver.resolveTarget(...)` pour normaliser l’identifiant
    de cible et fournir une solution de repli en cas d’absence dans l’annuaire,
    `messaging.inferTargetChatType(...)` lorsque le cœur a besoin de connaître
    rapidement le type de pair, et `messaging.resolveOutboundSessionRoute(...)`
    pour déterminer l’identité native du fournisseur pour la session et le fil
    de discussion.

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Common import path table">
  | Chemin d’importation | Objectif | Principales exportations |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Utilitaire d’entrée canonique pour les plugins | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation générale héritée pour les définitions et générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilitaire d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilitaires partagés de l’assistant de configuration | Traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Utilitaires d’exécution au moment de la configuration | `createSetupTranslator`, adaptateurs de correctifs de configuration pouvant être importés en toute sécurité, utilitaires de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsolète de l’adaptateur de configuration | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Utilitaires d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilitaires pour plusieurs comptes | Utilitaires de liste de comptes, de configuration et de contrôle d’accès aux actions |
  | `plugin-sdk/account-id` | Utilitaires d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation des identifiants de compte |
  | `plugin-sdk/account-resolution` | Utilitaires de recherche de compte | Utilitaires de recherche de compte et de repli sur la valeur par défaut |
  | `plugin-sdk/account-helpers` | Utilitaires de compte ciblés | Utilitaires de liste de comptes et d’actions sur les comptes |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association des messages privés | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse, de la saisie et de la livraison depuis la source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et utilitaires d’accès aux messages privés | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration des canaux et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration intégrés | Uniquement les plugins intégrés maintenus par OpenClaw ; les nouveaux plugins doivent définir des schémas locaux au plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration intégrés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins intégrés maintenus |
  | `plugin-sdk/telegram-command-config` | Utilitaires de configuration des commandes Telegram | Normalisation des noms de commandes, troncature des descriptions, validation des doublons et des conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques de groupe et de messages privés | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Utilitaires d’enveloppe entrante | Utilitaires partagés de génération de routes et d’enveloppes |
  | `plugin-sdk/channel-inbound` | Utilitaires de réception entrante | Construction du contexte, formatage, racines, exécuteurs, distribution des réponses préparées et prédicats de distribution |
  | `plugin-sdk/messaging-targets` | Chemin d’importation obsolète pour l’analyse des cibles | Utilisez `plugin-sdk/channel-targets` pour les utilitaires génériques d’analyse des cibles, `plugin-sdk/channel-route` pour la comparaison des routes, et les éléments appartenant au plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` pour la résolution des cibles propre au fournisseur |
  | `plugin-sdk/outbound-media` | Utilitaires de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Utilitaires du cycle de vie des messages sortants | Adaptateurs de messages, accusés de réception, utilitaires d’envoi durable, utilitaires d’aperçu en direct et de diffusion en continu, options de réponse, utilitaires de cycle de vie, identité sortante et planification de la charge utile |
  | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Utilitaires de liaison de fil de discussion | Utilitaires d’adaptation et de cycle de vie de la liaison de fil de discussion |
  | `plugin-sdk/agent-media-payload` | Utilitaires hérités de charge utile multimédia | Générateur de charge utile multimédia de l’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Couche de compatibilité obsolète | Uniquement les utilitaires hérités d’exécution des canaux |
  | `plugin-sdk/channel-send-result` | Types de résultats d’envoi | Types de résultats de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant des plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilitaires généraux d’exécution | Utilitaires d’exécution, de journalisation, de sauvegarde et d’installation de plugins |
  | `plugin-sdk/runtime-env` | Utilitaires ciblés d’environnement d’exécution | Utilitaires de journalisation et d’environnement d’exécution, de délai d’expiration, de nouvelle tentative et d’attente exponentielle |
  | `plugin-sdk/plugin-runtime` | Utilitaires partagés d’exécution des plugins | Utilitaires de commandes, de hooks, HTTP et interactifs des plugins |
  | `plugin-sdk/hook-runtime` | Utilitaires de pipeline de hooks | Utilitaires partagés de pipeline de Webhook et de hooks internes |
  | `plugin-sdk/lazy-runtime` | Utilitaires d’exécution différée | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilitaires de processus | Utilitaires partagés d’exécution de commandes |
  | `plugin-sdk/cli-runtime` | Utilitaires d’exécution de la CLI | Formatage des commandes, attentes, utilitaires de version |
  | `plugin-sdk/gateway-runtime` | Utilitaires du Gateway | Client du Gateway, utilitaire de démarrage lorsque la boucle d’événements est prête, résolution de l’hôte LAN annoncé et utilitaires de correction de l’état des canaux |
  | `plugin-sdk/config-runtime` | Couche de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Utilitaires de commandes Telegram | Utilitaires de validation des commandes Telegram avec repli stable lorsque la surface contractuelle intégrée de Telegram est indisponible |
  | `plugin-sdk/approval-runtime` | Utilitaires d’invite d’approbation | Charge utile d’approbation d’exécution ou de plugin, utilitaires de capacité et de profil d’approbation, utilitaires natifs de routage et d’exécution des approbations, et formatage structuré du chemin d’affichage des approbations |
  | `plugin-sdk/approval-auth-runtime` | Utilitaires d’authentification des approbations | Résolution des approbateurs, autorisation des actions dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Utilitaires du client d’approbation | Utilitaires natifs de profil et de filtrage des approbations d’exécution |
  | `plugin-sdk/approval-delivery-runtime` | Utilitaires de livraison des approbations | Adaptateurs natifs de capacité et de livraison des approbations |
  | `plugin-sdk/approval-gateway-runtime` | Utilitaires du Gateway pour les approbations | Résolveur partagé du Gateway pour les approbations |
  | `plugin-sdk/approval-reference-runtime` | Références de transport des approbations | Utilitaire déterministe de localisation durable pour les rappels limités par le transport |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilitaires d’adaptateur d’approbation | Utilitaires légers de chargement des adaptateurs natifs d’approbation pour les points d’entrée critiques des canaux |
  | `plugin-sdk/approval-handler-runtime` | Utilitaires de gestion des approbations | Utilitaires d’exécution plus généraux pour la gestion des approbations ; préférez les interfaces plus ciblées d’adaptateur et de Gateway lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Utilitaires de cible d’approbation | Utilitaires natifs de liaison des cibles et des comptes d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Utilitaires de réponse aux approbations | Utilitaires de charge utile des réponses d’approbation d’exécution ou de plugin |
  | `plugin-sdk/channel-runtime-context` | Utilitaires de contexte d’exécution des canaux | Utilitaires génériques d’enregistrement, d’obtention et de surveillance du contexte d’exécution des canaux |
  | `plugin-sdk/security-runtime` | Utilitaires de sécurité | Utilitaires partagés de confiance, de contrôle d’accès aux messages privés, de fichiers et chemins limités à la racine, de contenu externe et de collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Utilitaires de politique SSRF | Utilitaires de liste d’autorisation des hôtes et de politique des réseaux privés |
  | `plugin-sdk/ssrf-runtime` | Utilitaires d’exécution SSRF | Répartiteur épinglé, récupération protégée, utilitaires de politique SSRF |
  | `plugin-sdk/system-event-runtime` | Utilitaires d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Utilitaires de Heartbeat | Utilitaires de réveil, d’événements et de visibilité de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Utilitaires de file d’attente de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Utilitaires d’activité des canaux | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Utilitaires de déduplication | Caches de déduplication en mémoire et adossés à un stockage persistant |
  | `plugin-sdk/file-access-runtime` | Utilitaires d’accès aux fichiers | Utilitaires sécurisés de chemins de fichiers locaux et de médias |
  | `plugin-sdk/transport-ready-runtime` | Utilitaires de disponibilité du transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Utilitaires de politique d’approbation d’exécution | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Utilitaires de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilitaires de contrôle des diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilitaires d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, utilitaires de graphe d’erreurs, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | Utilitaires de récupération encapsulée et de proxy | `resolveFetch`, utilitaires de proxy, utilitaires d’options d’EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Utilitaires de normalisation des hôtes | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilitaires de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politiques |
  | `plugin-sdk/allow-from` | Formatage des listes d’autorisation et mappage des entrées | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Utilitaires de contrôle d’accès aux commandes et de surface de commandes | `resolveControlCommandGate`, utilitaires d’autorisation des expéditeurs, utilitaires de registre de commandes, notamment le formatage dynamique du menu des arguments |
  | `plugin-sdk/command-status` | Générateurs d’affichage de l’état et de l’aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées de secrets | Utilitaires d’entrée de secrets |
  | `plugin-sdk/webhook-ingress` | Utilitaires de requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilitaires de protection du corps des requêtes Webhook | Utilitaires de lecture et de limitation du corps des requêtes |
  | `plugin-sdk/reply-runtime` | Environnement d’exécution partagé des réponses | Distribution entrante, Heartbeat, planificateur de réponses, segmentation |
  | `plugin-sdk/reply-dispatch-runtime` | Utilitaires ciblés de distribution des réponses | Utilitaires de finalisation, de distribution par fournisseur et de libellés de conversation |
  | `plugin-sdk/reply-history` | Utilitaires d’historique des réponses | `createChannelHistoryWindow` ; exportations de compatibilité obsolètes des utilitaires de mappage, telles que `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilitaires de segmentation des réponses | Utilitaires de segmentation de texte et de Markdown |
  | `plugin-sdk/session-store-runtime` | Utilitaires de stockage des sessions | Utilitaires de lignes de session à portée limitée, utilitaires de chemin du stockage et lectures de la date de mise à jour |
  | `plugin-sdk/state-paths` | Utilitaires de chemins d’état | Utilitaires de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Utilitaires de routage et de clés de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilitaires de normalisation des clés de session |
  | `plugin-sdk/status-helpers` | Utilitaires d’état des canaux | Générateurs de résumés d’état des canaux et des comptes, valeurs par défaut de l’état d’exécution, utilitaires de métadonnées de problèmes |
  | `plugin-sdk/target-resolver-runtime` | Utilitaires de résolution de cible | Utilitaires partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation des chaînes | Utilitaires de normalisation des slugs et des chaînes |
  | `plugin-sdk/request-url` | Utilitaires d’URL de requête | Extraction d’URL sous forme de chaînes depuis des entrées similaires à des requêtes |
  | `plugin-sdk/run-command` | Utilitaires de commandes temporisées | Exécuteur de commandes temporisées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs courants de paramètres d’outils et de CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraction de charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction des paramètres d’envoi d’outil | Extraction des champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Utilitaires de chemins temporaires | Utilitaires partagés de chemins de téléchargement temporaires |
  | `plugin-sdk/logging-core` | Utilitaires de journalisation | Utilitaires de journalisation des sous-systèmes et de masquage |
  | `plugin-sdk/markdown-table-runtime` | Utilitaires de tableaux Markdown | Utilitaires de mode des tableaux Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse aux messages | Types de charges utiles de réponse |
  | `plugin-sdk/provider-setup` | Utilitaires sélectionnés de configuration de fournisseurs locaux ou auto-hébergés | Utilitaires de découverte et de configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Utilitaires ciblés de configuration de fournisseurs auto-hébergés compatibles avec OpenAI | Mêmes utilitaires de découverte et de configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Utilitaires d’authentification des fournisseurs à l’exécution | Utilitaires de résolution des clés d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Utilitaires de configuration des clés d’API des fournisseurs | Utilitaires d’intégration et d’écriture de profils avec une clé d’API |
  | `plugin-sdk/provider-auth-result` | Utilitaires de résultat d’authentification des fournisseurs | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Utilitaires de sélection des fournisseurs | Sélection d’un fournisseur configuré ou automatique et fusion de la configuration brute des fournisseurs |
  | `plugin-sdk/provider-env-vars` | Utilitaires de variables d’environnement des fournisseurs | Utilitaires de recherche des variables d’environnement d’authentification des fournisseurs |
  | `plugin-sdk/provider-model-shared` | Utilitaires partagés de modèles et de relecture des fournisseurs | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de stratégies de relecture, utilitaires de points de terminaison des fournisseurs et utilitaires de normalisation des identifiants de modèles |
  | `plugin-sdk/provider-catalog-shared` | Utilitaires partagés de catalogues de fournisseurs | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration des fournisseurs | Utilitaires de configuration de l’intégration |
  | `plugin-sdk/provider-http` | Utilitaires HTTP des fournisseurs | Utilitaires génériques de capacités HTTP et de points de terminaison des fournisseurs, notamment les utilitaires de formulaires multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Utilitaires de récupération web des fournisseurs | Utilitaires d’enregistrement et de cache des fournisseurs de récupération web |
  | `plugin-sdk/provider-web-search-config-contract` | Utilitaires de configuration de recherche web des fournisseurs | Utilitaires ciblés de configuration et d’identifiants de recherche web pour les fournisseurs ne nécessitant pas de mécanisme d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat de recherche web des fournisseurs | Utilitaires ciblés de contrat de configuration et d’identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que les accesseurs et mutateurs d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Utilitaires de recherche web des fournisseurs | Utilitaires d’enregistrement, de cache et d’exécution des fournisseurs de recherche web |
  | `plugin-sdk/provider-tools` | Utilitaires de compatibilité des outils et schémas des fournisseurs | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, ainsi que nettoyage et diagnostic des schémas DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Utilitaires d’utilisation des fournisseurs | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres utilitaires d’utilisation des fournisseurs |
  | `plugin-sdk/provider-stream` | Utilitaires d’enveloppes de flux des fournisseurs | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux et utilitaires partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport des fournisseurs | Utilitaires de transport natif des fournisseurs, tels que la récupération protégée, l’extraction du texte des résultats d’outils, les transformations des messages de transport et les flux inscriptibles d’événements de transport |
  | `plugin-sdk/keyed-async-queue` | File d’attente asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilitaires multimédias partagés | Utilitaires de récupération, de transformation et de stockage des médias, détection des dimensions vidéo basée sur ffprobe et générateurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Utilitaires partagés de génération multimédia | Utilitaires partagés de basculement, sélection de candidats et messages signalant l’absence de modèle pour la génération d’images, de vidéos et de musique |
  | `plugin-sdk/media-understanding` | Utilitaires de compréhension multimédia | Types de fournisseurs de compréhension multimédia et exports d’utilitaires d’image et d’audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Export étendu obsolète de compatibilité textuelle | Utilisez `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Utilitaires de segmentation du texte | Utilitaire de segmentation du texte sortant |
  | `plugin-sdk/speech` | Utilitaires vocaux | Types de fournisseurs vocaux, utilitaires de directives, de registre et de validation destinés aux fournisseurs, ainsi que générateur TTS compatible avec OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives et normalisation |
  | `plugin-sdk/realtime-transcription` | Utilitaires de transcription en temps réel | Types de fournisseurs, utilitaires de registre et utilitaire partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Utilitaires vocaux en temps réel | Types de fournisseurs, utilitaires de registre et de résolution, utilitaires de session de pont, files d’attente partagées de réponse vocale de l’agent, contrôle vocal de l’exécution active, état des transcriptions et des événements, suppression de l’écho, correspondance des questions de consultation, coordination des consultations forcées, suivi du contexte des tours, suivi de l’activité de sortie et utilitaires de consultation rapide du contexte |
  | `plugin-sdk/image-generation` | Utilitaires de génération d’images | Types de fournisseurs de génération d’images, utilitaires de ressources d’image et d’URL de données, ainsi que générateur de fournisseur d’images compatible avec OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et utilitaires de registre |
  | `plugin-sdk/music-generation` | Utilitaires de génération musicale | Types de fournisseurs, de requêtes et de résultats de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, utilitaires de basculement, recherche de fournisseurs et analyse des références de modèles |
  | `plugin-sdk/video-generation` | Utilitaires de génération vidéo | Types de fournisseurs, de requêtes et de résultats de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, utilitaires de basculement, recherche de fournisseurs et analyse des références de modèles |
  | `plugin-sdk/interactive-runtime` | Utilitaires de réponse interactive | Normalisation et réduction des charges utiles de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration des canaux | Primitives ciblées de schéma de configuration des canaux |
  | `plugin-sdk/channel-config-writes` | Utilitaires d’écriture de configuration des canaux | Utilitaires d’autorisation d’écriture de la configuration des canaux |
  | `plugin-sdk/channel-plugin-common` | Préambule partagé des canaux | Exports du préambule partagé des Plugins de canaux |
  | `plugin-sdk/channel-status` | Utilitaires d’état des canaux | Utilitaires partagés d’instantanés et de résumés d’état des canaux |
  | `plugin-sdk/allowlist-config-edit` | Utilitaires de configuration de liste d’autorisation | Utilitaires de modification et de lecture de la configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Utilitaires d’accès aux groupes | Utilitaires partagés de décision d’accès aux groupes |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes | Utilisez `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Utilitaires de protection des messages privés directs | Utilitaires ciblés de stratégie de protection pré-cryptographique |
  | `plugin-sdk/extension-shared` | Utilitaires d’extension partagés | Primitives d’utilitaires pour les canaux passifs, leur état et les proxys ambiants |
  | `plugin-sdk/webhook-targets` | Utilitaires de cibles de Webhook | Registre des cibles de Webhook et utilitaires d’installation des routes |
  | `plugin-sdk/webhook-path` | Alias obsolète de chemin de Webhook | Utilisez `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Utilitaires partagés de médias web | Utilitaires de chargement de médias distants et locaux |
  | `plugin-sdk/zod` | Réexportation obsolète de compatibilité Zod | Importez `zod` directement depuis `zod` |
  | `plugin-sdk/memory-core` | Utilitaires memory-core intégrés | Surface d’utilitaires du gestionnaire de mémoire, de configuration, de fichiers et de CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution de l’indexation et de la recherche en mémoire |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registre des plongements de mémoire | Utilitaires légers du registre des fournisseurs de plongements de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondamental de l’hôte de mémoire | Exports du moteur fondamental de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur de plongements de l’hôte de mémoire | Contrats de plongements de mémoire, accès au registre, fournisseur local et utilitaires génériques de traitement par lots et à distance ; les fournisseurs distants concrets résident dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte de mémoire | Exports du moteur QMD de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte de mémoire | Exports du moteur de stockage de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Utilitaires multimodaux de l’hôte de mémoire | Utilitaires multimodaux de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Utilitaires de requête de l’hôte de mémoire | Utilitaires de requête de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Utilitaires de secrets de l’hôte de mémoire | Utilitaires de secrets de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias obsolète des événements de mémoire | Utilisez `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Utilitaires d’état de l’hôte de mémoire | Utilitaires d’état de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte de mémoire | Utilitaires d’exécution CLI de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution du noyau de l’hôte de mémoire | Utilitaires d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilitaires de fichiers et d’exécution de l’hôte de mémoire | Utilitaires de fichiers et d’exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution du noyau de l’hôte de mémoire | Alias indépendant du fournisseur pour les utilitaires d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias du journal d’événements de l’hôte de mémoire | Alias indépendant du fournisseur pour les utilitaires du journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias obsolète de fichiers et d’exécution de mémoire | Utilisez `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Utilitaires Markdown gérés | Utilitaires partagés de Markdown géré pour les Plugins liés à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution différée du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsolète d’état de l’hôte de mémoire | Utilisez `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Point d’exportation local au dépôt et obsolète pour la compatibilité ; utilisez des sous-chemins de test ciblés et locaux au dépôt tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

  Ce tableau présente le sous-ensemble commun pour la migration, et non l’intégralité de la surface du SDK. L’inventaire des points d’entrée du compilateur se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les exportations de paquet sont générées à partir du sous-ensemble public.

  Les interfaces d’assistance réservées aux plugins intégrés ont été retirées de la
  carte d’exportation du SDK public, à l’exception des façades de compatibilité explicitement documentées, telles que le
  shim `plugin-sdk/discord` obsolète, conservé pour les plugins externes qui
  importent encore directement le paquet publié `@openclaw/discord`. Les
  assistants propres à un propriétaire résident dans le paquet du plugin concerné ; le comportement partagé de l’hôte passe
  par des contrats SDK génériques tels que `plugin-sdk/gateway-runtime`,
  `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

  Utilisez l’importation la plus ciblée correspondant à la tâche. Si vous ne trouvez pas une exportation,
  consultez le code source dans `src/plugin-sdk/` ou demandez aux responsables quel contrat
  générique doit en être propriétaire.

  ## Dépréciations actives

  Dépréciations plus ciblées dans le SDK des plugins, le contrat des fournisseurs, la surface
  d’exécution et le manifeste. Chacune fonctionne encore actuellement, mais sera supprimée dans une prochaine
  version majeure. Chaque entrée associe l’ancienne API à son remplacement canonique.

  <AccordionGroup>
  <Accordion title="Générateurs d’aide command-auth -> command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exportations ; seule l’importation se fait depuis le sous-chemin plus ciblé. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Avant
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Après
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Assistants de filtrage des mentions -> resolveInboundMentionDecision">
    **Ancien** : `resolveMentionGating(params)` et
    `resolveMentionGatingWithBypass(params)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` — un seul objet de
    décision au lieu de deux formes d’appel distinctes.

    Adopté dans Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp et Zalo. Le modèle d’événement `app_mention` propre à Slack
    n’utilise pas cet assistant.

  </Accordion>

  <Accordion title="Shim d’exécution des canaux et assistants d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité destiné aux anciens
    plugins de canal. Ne l’importez pas dans du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les assistants `channelActions*` de `openclaw/plugin-sdk/channel-actions` sont
    obsolètes, tout comme les exportations brutes d’« actions » de canal. Exposez plutôt les capacités
    par l’intermédiaire de la surface sémantique `presentation` : les plugins de canal
    déclarent ce qu’ils affichent (cartes, boutons, sélecteurs), plutôt que les noms
    d’actions brutes qu’ils acceptent.

  </Accordion>

  <Accordion title="Assistant tool() du fournisseur de recherche Web -> createTool() sur le plugin">
    **Ancien** : fabrique `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin fournisseur.
    OpenClaw n’a plus besoin de l’assistant du SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut -> BodyForAgent">
    **Ancien** : `api.runtime.channel.reply.formatInboundEnvelope(...)` (ainsi que le
    champ `channelEnvelope` des objets de message entrants) pour construire une enveloppe
    d’invite plate en texte brut à partir des messages entrants du canal.

    **Nouveau** : `BodyForAgent` accompagné de blocs structurés de contexte utilisateur. Les plugins de
    canal joignent les métadonnées de routage (fil, sujet, réponse à, réactions) sous forme de
    champs typés, au lieu de les concaténer dans une chaîne d’invite. L’assistant
    `formatAgentEnvelope(...)` reste pris en charge pour les enveloppes synthétisées
    destinées à l’assistant, mais les enveloppes entrantes en texte brut sont en voie
    de suppression.

    Zones concernées : `inbound_claim`, `message_received` et tout plugin de
    canal personnalisé qui post-traitait l’ancien texte de l’enveloppe.

  </Accordion>

  <Accordion title="Hook deactivate -> gateway_stop">
    **Ancien** : `api.on("deactivate", handler)`.

    **Nouveau** : `api.on("gateway_stop", handler)`. Même contrat de nettoyage lors de
    l’arrêt ; seul le nom du hook change.

    ```typescript
    // Avant
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // Après
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` reste connecté comme alias de compatibilité obsolète jusqu’à sa
    suppression après le 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning -> liaison de fil par le cœur">
    **Ancien** : `api.on("subagent_spawning", handler)` renvoyant
    `threadBindingReady` ou `deliveryOrigin`.

    **Nouveau** : laissez le cœur préparer les liaisons de sous-agent `thread: true` via
    l’adaptateur de liaison de session du canal. Utilisez `api.on("subagent_spawned", handler)`
    uniquement pour l’observation après le lancement.

    ```typescript
    // Avant
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // Après
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` et
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ne subsistent que comme
    surfaces de compatibilité obsolètes pendant la migration des plugins externes, et seront supprimés
    après le 2026-08-30.

  </Accordion>

  <Accordion title="Types de découverte des fournisseurs -> types du catalogue des fournisseurs">
    Quatre alias de type de découverte sont désormais de fines enveloppes autour des types de
    l’ère du catalogue :

    | Ancien alias                | Nouveau type               |
    | --------------------------- | -------------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`     |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`   |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`    |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`    |

    S’y ajoute l’ancien conteneur statique `ProviderCapabilities` : les plugins fournisseurs
    doivent utiliser des hooks de fournisseur explicites tels que `buildReplayPolicy`,
    `normalizeToolSchemas` et `wrapStreamFn`, plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="Hooks de politique de réflexion -> resolveThinkingProfile">
    **Ancien** (trois hooks distincts sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et une
    liste ordonnée de niveaux. OpenClaw rétrograde automatiquement les anciennes valeurs
    enregistrées selon le rang du profil.

    Le contexte comprend `provider`, `modelId`, un `reasoning` fusionné facultatif
    et des informations `compat` facultatives fusionnées concernant le modèle. Les plugins fournisseurs peuvent utiliser ces
    informations du catalogue pour exposer un profil propre au modèle uniquement lorsque le contrat de
    requête configuré le prend en charge.

    Implémentez un seul hook au lieu de trois. Les anciens hooks continuent de fonctionner pendant
    la période de dépréciation, mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="Fournisseurs d’authentification externes -> contracts.externalAuthProviders">
    **Ancien** : implémentation de hooks d’authentification externes sans déclarer le fournisseur
    dans le manifeste du plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste du plugin
    **et** implémentez `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Recherche des variables d’environnement du fournisseur -> setup.providers[].envVars">
    **Ancien** champ du manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : reproduisez la même recherche de variables d’environnement dans `setup.providers[].envVars`
    au sein du manifeste. Cela regroupe au même endroit les métadonnées d’environnement de configuration et d’état
    et évite de démarrer l’environnement d’exécution du plugin uniquement pour répondre aux recherches de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge par un adaptateur de compatibilité
    jusqu’à la fin de la période de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement du plugin de mémoire -> registerMemoryCapability">
    **Ancien** : trois appels distincts — `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **Nouveau** : un seul appel sur l’API d’état de la mémoire —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les assistants additifs d’invite et de corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) ne sont
    pas concernés.

  </Accordion>

  <Accordion title="API du fournisseur de plongements pour la mémoire">
    **Ancien** : `api.registerMemoryEmbeddingProvider(...)` et
    `contracts.memoryEmbeddingProviders`.

    **Nouveau** : `api.registerEmbeddingProvider(...)` et
    `contracts.embeddingProviders`.

    Le contrat générique du fournisseur de plongements est réutilisable en dehors de la mémoire et constitue
    la voie prise en charge pour les nouveaux fournisseurs. L’API d’enregistrement propre à la mémoire
    reste connectée comme compatibilité obsolète pendant la migration des fournisseurs
    existants. L’inspection des plugins signale l’utilisation par des plugins non intégrés comme une dette de
    compatibilité.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux anciens alias de type sont toujours exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                        | Nouveau                              |
    | ----------------------------- | ------------------------------------ |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams`   |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult`   |

    La méthode d’exécution `readSession` est obsolète au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la
    nouvelle.

  </Accordion>

  <Accordion title="API de fichiers de session et de transcription supprimées">
    Le passage des sessions et transcriptions à SQLite supprime ou rend obsolètes les API
    destinées aux plugins qui exposaient des magasins `sessions.json` actifs, des chemins de transcription
    JSONL ou des listes de fichiers de session. Les plugins d’exécution doivent utiliser l’identité de session et les assistants
    d’exécution du SDK au lieu de résoudre ou de modifier les fichiers actifs.

    | Surface à migrer | Remplacement |
    | ----------------- | ----------- |
    | `loadSessionStore(...)`, `updateSessionStore(...)` et `resolveSessionStoreEntry(...)` obsolètes | `getSessionEntry(...)`, `listSessionEntries(...)` et mutations de session au niveau des lignes. |
    | `resolveSessionFilePath(...)` obsolète | Identité de session (`sessionKey`, `sessionId` et assistants de cible d’exécution du SDK), ainsi que méthodes du Gateway opérant sur la session actuelle. |
    | `saveSessionStore(...)` supprimé | API d’exécution de session détenues par le Gateway ; le code des plugins doit demander ou modifier l’état de session à l’aide des assistants d’exécution/de contexte documentés, au lieu d’écrire dans le fichier de stockage actif. |
    | `resolveSessionTranscriptPathInDir(...)` et `resolveAndPersistSessionFile(...)` supprimés | Identité de session et méthodes du Gateway opérant sur la session actuelle. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | Lecteurs de transcription fondés sur l’identité et exposés par le contexte d’exécution actuel, ou méthodes d’historique/de session du Gateway lorsque le plugin se trouve hors du chemin propriétaire de la transcription. |
    | `SessionTranscriptUpdate.sessionFile` | `SessionTranscriptUpdate.target` avec `agentId`, `sessionKey` et `sessionId`. |
    | Entrées de synchronisation de la mémoire telles que `sessionFiles` | Sources de transcription/session fondées sur l’identité et fournies par l’hôte ; ne parcourez pas les fichiers JSONL actifs des sessions en direct. |
    | Options d’exécution nommées `transcriptPath` ou `sessionFile` pour les sessions actives | Objets `sessionTarget`/de cible d’exécution qui véhiculent une identité de session indépendante du stockage. |

    Les anciens fichiers de transcription JSONL restent valides comme artefacts
    d’importation, d’archivage, d’exportation et d’assistance. Ils ne constituent
    plus le contrat d’exécution permanent des sessions actives.

    Les plugins officiels publiés avec `v2026.7.1-beta.5` importaient les quatre
    assistants obsolètes ci-dessus. `openclaw/plugin-sdk/session-store-runtime`
    conserve exactement cette passerelle jusqu’au 2026-10-12 ; les nouveaux
    plugins doivent utiliser les remplacements. `resolveStorePath(...)` reste
    un assistant SDK pris en charge et ne fait pas partie de cette dépréciation.

    `openclaw plugins inspect --all --runtime` signale les plugins non intégrés
    dont les erreurs de chargement ou les diagnostics font encore référence à
    ces API de fichiers supprimées. L’analyse consultative
    `@openclaw/plugin-inspector` doit utiliser la version `0.3.17` ou une version
    ultérieure afin que les analyses de paquets externes signalent également,
    avant la publication, les assistants de session portant sur l’ensemble du
    stockage, les assistants de chemin de fichier de session, les anciennes
    cibles de fichier de transcription et les assistants de transcription de
    bas niveau.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (au singulier) renvoyait un accesseur
    TaskFlow actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’environnement
    d’exécution de mutation TaskFlow géré pour les plugins qui créent, mettent
    à jour, annulent ou exécutent des tâches enfants à partir d’un flux.
    Utilisez `runtime.tasks.flows` lorsque le plugin nécessite uniquement des
    lectures fondées sur des DTO.

    ```typescript
    // Avant
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // Après
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    Supprimé après le 2026-07-26.

  </Accordion>

  <Accordion title="Fabriques d’extensions intégrées -> intergiciel de résultats d’outil d’agent">
    Traité dans [Procédure de migration](#how-to-migrate) ci-dessus. Inclus ici
    par souci d’exhaustivité : le chemin supprimé
    `api.registerEmbeddedExtensionFactory(...)`, réservé à l’ancien exécuteur
    intégré, est remplacé par `api.registerAgentToolResultMiddleware(...)` avec
    une liste explicite d’environnements d’exécution dans
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType -> OpenClawConfig">
    `OpenClawSchemaType`, réexporté depuis `openclaw/plugin-sdk`, est désormais
    un alias d’une ligne pour `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Avant
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Après
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations propres aux extensions (dans les plugins de canal/fournisseur
intégrés sous `extensions/`) sont suivies dans leurs propres fichiers
d’exportation `api.ts` et `runtime-api.ts`. Elles n’affectent pas les contrats
des plugins tiers et ne sont pas répertoriées ici. Si vous utilisez directement
le fichier d’exportation local d’un plugin intégré, lisez ses commentaires de
dépréciation avant d’effectuer la mise à niveau.
</Note>

## Migration de Talk et de la voix en temps réel

Le code de voix en temps réel, de téléphonie, de réunion et de Talk dans le
navigateur partage un contrôleur de session Talk exporté par
`openclaw/plugin-sdk/realtime-voice`. Le contrôleur possède l’enveloppe commune
des événements Talk, l’état du tour actif, l’état de capture, l’état de la
sortie audio, l’historique récent des événements et le rejet des tours
obsolètes. Les plugins fournisseurs possèdent les sessions en temps réel
propres à chaque fournisseur ; les plugins de surface possèdent les
particularités de la capture, de la lecture, de la téléphonie et des réunions.

Toutes les surfaces intégrées s’exécutent sur le contrôleur partagé : relais
du navigateur, transfert vers une salle gérée, appel vocal en temps réel,
reconnaissance vocale en continu pour les appels vocaux, Google Meet en temps
réel et mode natif « appuyer pour parler ». Le Gateway annonce un seul canal
d’événements Talk en direct dans `hello-ok.features.events` : `talk.event`.

Le nouveau code ne doit pas appeler directement
`createTalkEventSequencer(...)`, sauf pour implémenter un adaptateur de bas
niveau ou un dispositif de test. Utilisez le contrôleur partagé afin que les
événements limités à un tour ne puissent pas être émis sans identifiant de
tour, que les appels `turnEnd` / `turnCancel` obsolètes ne puissent pas effacer
un tour actif plus récent et que les événements du cycle de vie de la sortie
audio restent cohérents entre la téléphonie, les réunions, le relais du
navigateur, le transfert vers une salle gérée et les clients Talk natifs.

Forme de l’API publique :

```typescript
// API de session Talk détenue par le Gateway.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// API de session fournisseur détenue par le client.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Les sessions WebRTC/WebSocket fournisseur détenues par le navigateur utilisent
`talk.client.create`, car le navigateur prend en charge la négociation avec le
fournisseur et le transport des médias, tandis que le Gateway possède les
identifiants, les instructions et la politique des outils. `talk.session.*`
est la surface commune gérée par le Gateway pour le temps réel via relais du
Gateway, la transcription via relais du Gateway et les sessions STT/TTS
natives en salle gérée.

Les anciennes configurations qui placent les sélecteurs en temps réel à côté
de `talk.provider` / `talk.providers` doivent être réparées avec
`openclaw doctor --fix` ; l’environnement d’exécution Talk ne réinterprète pas
la configuration du fournisseur de parole/TTS comme une configuration de
fournisseur en temps réel.

Les combinaisons prises en charge par `talk.session.create` sont
intentionnellement peu nombreuses :

| Mode            | Transport       | Cerveau         | Propriétaire        | Remarques                                                                                                                 |
| --------------- | --------------- | --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway             | Audio fournisseur bidirectionnel intégral relayé par le Gateway ; les appels d’outils passent par l’outil agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway             | STT en continu uniquement ; les appelants envoient l’audio d’entrée et reçoivent les événements de transcription.        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de type « appuyer pour parler » et talkie-walkie dans lesquelles le client possède la capture/lecture et le Gateway possède l’état du tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode de salle réservé aux administrateurs pour les surfaces propriétaires approuvées qui exécutent directement les actions d’outil du Gateway. |

Correspondance des méthodes pour les lecteurs migrant depuis les anciennes
familles `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` (toutes
supprimées) :

| Ancien                           | Nouveau                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` ou `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Le vocabulaire de contrôle unifié est lui aussi volontairement restreint :

| Méthode                         | S’applique à                                            | Contrat                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajoute un fragment audio PCM encodé en base64 à la session du fournisseur appartenant à la même connexion Gateway.                                                                                                        |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarre un tour utilisateur dans une salle gérée.                                                                                                                                                                         |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termine le tour actif après validation de son absence d’obsolescence.                                                                                                                                                     |
| `talk.session.cancelTurn`       | toutes les sessions appartenant au Gateway              | Annule les tâches actives de capture, du fournisseur, de l’agent et de synthèse vocale pour un tour.                                                                                                                      |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrête la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                                                   |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Termine un appel d’outil du fournisseur après toute exécution asynchrone exposée par son pont ; transmettez `options.willContinue` pour une sortie intermédiaire ou, si pris en charge, `options.suppressResponse` afin d’éviter une autre réponse de l’assistant. |
| `talk.session.steer`            | sessions Talk adossées à un agent                       | Envoie une commande vocale `status`, `steer`, `cancel` ou `followup` à l’exécution intégrée active déterminée à partir de la session Talk.                                                                                  |
| `talk.session.close`            | toutes les sessions unifiées                            | Arrête les sessions de relais ou révoque l’état de la salle gérée, puis oublie l’identifiant de session unifiée.                                                                                                          |

N’introduisez pas de cas particuliers propres à un fournisseur ou à une plateforme dans le cœur pour assurer ce fonctionnement.
Le cœur gère la sémantique des sessions Talk. Les plugins de fournisseur gèrent la configuration des sessions propres aux fournisseurs.
Voice-call et Google Meet gèrent les adaptateurs de téléphonie et de réunion. Le navigateur et les applications
natives gèrent l’expérience utilisateur de capture et de lecture sur l’appareil.

## Calendrier de suppression

| Quand                                             | Ce qui se passe                                                                                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maintenant**                                    | Les surfaces obsolètes émettent des avertissements lors de l’exécution.                                                                                  |
| **Date `removeAfter` de chaque entrée de compatibilité** | La surface concernée peut être supprimée ; `pnpm plugins:boundary-report --fail-on-eligible-compat` fait échouer la CI une fois la date dépassée. |
| **Prochaine version majeure**                     | Toutes les surfaces qui n’ont toujours pas été migrées sont supprimées ; les plugins qui les utilisent encore échoueront.                                |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure. Exécutez `pnpm plugins:boundary-report` pour savoir quelles
entrées de compatibilité arriveront le plus tôt à échéance pour les surfaces utilisées par votre plugin.

## Suppression temporaire des avertissements

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une solution de contournement temporaire, et non d’une solution permanente.

## Ressources connexes

- [Bien démarrer](/fr/plugins/building-plugins) - créez votre premier plugin
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - création de plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - création de plugins de fournisseur
- [Fonctionnement interne des plugins](/fr/plugins/architecture) - présentation approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) - référence du schéma du manifeste
