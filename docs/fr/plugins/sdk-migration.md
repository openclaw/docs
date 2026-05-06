---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous avez utilisé api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le SDK de Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-05-06T07:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugins moderne avec des imports ciblés et documentés. Si votre plugin a été créé avant la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** - un import unique qui réexportait des dizaines de helpers. Il a été introduit pour maintenir le fonctionnement des anciens plugins basés sur des hooks pendant la construction de la nouvelle architecture de plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un large barrel de helpers d’exécution qui mélangeait événements système, état de Heartbeat, files de livraison, helpers fetch/proxy, helpers de fichiers, types d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large barrel de compatibilité de configuration qui conserve encore des helpers directs de chargement/écriture obsolètes pendant la fenêtre de migration.
- **`openclaw/extension-api`** - un pont qui donnait aux plugins un accès direct aux helpers côté hôte, comme le runner d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension groupée, réservé à Pi et supprimé, qui pouvait observer les événements du runner intégré comme `tool_result`.

Les surfaces d’import larges sont maintenant **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux plugins ne doivent pas les utiliser, et les plugins existants devraient migrer avant que la prochaine version majeure ne les supprime. L’API d’enregistrement de fabrique d’extension intégrée réservée à Pi a été supprimée ; utilisez plutôt un middleware de résultats d’outils.

OpenClaw ne supprime ni ne réinterprète un comportement de plugin documenté dans le même changement qui introduit son remplacement. Les changements de contrat incompatibles doivent d’abord passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation. Cela s’applique aux imports SDK, aux champs de manifeste, aux API de configuration, aux hooks et au comportement d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
  Les enregistrements de fabriques d’extensions intégrées réservés à Pi ne se chargent déjà plus.
</Warning>

## Pourquoi ce changement

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer un seul helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** - les réexports larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** - aucun moyen de savoir quels exports étaient stables ou internes

Le SDK de plugins moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome, avec un objectif clair et un contrat documenté.

Les anciens points de convenance de fournisseurs pour les canaux groupés ont également disparu.
Les points de helpers marqués par canal étaient des raccourcis privés de mono-repo, pas des contrats de plugins stables. Utilisez plutôt des sous-chemins SDK génériques et ciblés. Dans l’espace de travail des plugins groupés, conservez les helpers appartenant au fournisseur dans le `api.ts` ou le `runtime-api.ts` propre à ce plugin.

Exemples actuels de fournisseurs groupés :

- Anthropic conserve les helpers de flux propres à Claude dans son propre point `api.ts` / `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les helpers de modèle par défaut et les builders de fournisseur realtime dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les helpers d’onboarding/configuration dans son propre `api.ts`

## Plan de migration Talk et voix realtime

Le code Talk pour la voix realtime, la téléphonie, les réunions et le navigateur passe d’un suivi des tours local à chaque surface à un contrôleur de session Talk partagé exporté par `openclaw/plugin-sdk/realtime-voice`. Le nouveau contrôleur possède l’enveloppe commune d’événement Talk, l’état du tour actif, l’état de capture, l’état de sortie audio, l’historique récent des événements et le rejet des tours périmés. Les plugins de fournisseurs doivent continuer à posséder les sessions realtime propres aux vendeurs ; les plugins de surface doivent continuer à posséder la capture, la lecture, la téléphonie et les particularités de réunion.

Cette migration Talk est volontairement incompatible de façon nette :

1. Conserver les primitives partagées de contrôleur/runtime dans `plugin-sdk/realtime-voice`.
2. Déplacer les surfaces groupées vers le contrôleur partagé : relais navigateur, transfert de salle gérée, realtime d’appel vocal, STT en streaming d’appel vocal, Google Meet realtime et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*` et `talk.client.*`.
4. Annoncer un seul canal d’événements Talk live dans `hello-ok.features.events` du Gateway : `talk.event`.
5. Supprimer l’ancien endpoint HTTP realtime et tout chemin de surcharge d’instructions au moment de la requête.

Le nouveau code ne doit pas appeler directement `createTalkEventSequencer(...)`, sauf s’il implémente un adaptateur bas niveau ou un fixture de test. Préférez le contrôleur partagé afin que les événements limités à un tour ne puissent pas être émis sans identifiant de tour, que les appels `turnEnd` / `turnCancel` périmés ne puissent pas effacer un tour actif plus récent, et que les événements de cycle de vie de sortie audio restent cohérents entre téléphonie, réunions, relais navigateur, transfert de salle gérée et clients Talk natifs.

La forme cible de l’API publique est :

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

Les sessions WebRTC/websocket fournisseur appartenant au navigateur utilisent `talk.client.create`, car le navigateur possède la négociation fournisseur et le transport média, tandis que le Gateway possède les identifiants, les instructions et la politique d’outils. `talk.session.*` est la surface commune gérée par le Gateway pour les sessions realtime gateway-relay, de transcription gateway-relay, et STT/TTS natives en salle gérée.

Les configurations héritées qui plaçaient les sélecteurs realtime à côté de `talk.provider` / `talk.providers` doivent être réparées avec `openclaw doctor --fix` ; Talk à l’exécution ne réinterprète pas la configuration de fournisseur speech/TTS comme configuration de fournisseur realtime.

Les combinaisons prises en charge par `talk.session.create` sont volontairement limitées :

| Mode            | Transport       | Cerveau         | Propriétaire       | Notes                                                                                                                   |
| --------------- | --------------- | --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio fournisseur full-duplex relayé par le Gateway ; les appels d’outils sont routés via l’outil agent-consult.        |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription.     |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de style push-to-talk et talkie-walkie où le client possède la capture/lecture et le Gateway possède l’état du tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode de salle réservé aux administrateurs pour les surfaces first-party de confiance qui exécutent directement les actions d’outils du Gateway. |

Table de correspondance des méthodes supprimées :

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

Le vocabulaire de contrôle unifié est également volontairement restreint :

| Méthode                         | S’applique à                                           | Contrat                                                                                                   |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajouter un fragment audio PCM base64 à la session fournisseur possédée par la même connexion Gateway.    |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarrer un tour utilisateur en salle gérée.                                                              |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Terminer le tour actif après validation des tours périmés.                                                |
| `talk.session.cancelTurn`       | toutes les sessions appartenant au Gateway              | Annuler le travail actif de capture/fournisseur/agent/TTS pour un tour.                                  |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrêter la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                  |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Terminer un appel d’outil fournisseur émis par le relais.                                                 |
| `talk.session.close`            | toutes les sessions unifiées                            | Arrêter les sessions de relais ou révoquer l’état de salle gérée, puis oublier l’identifiant de session unifié. |

N’introduisez pas de cas particuliers de fournisseur ou de plateforme dans le noyau pour faire fonctionner cela.
Le noyau possède la sémantique des sessions Talk. Les plugins de fournisseurs possèdent la configuration des sessions vendeur.
Voice-call et Google Meet possèdent les adaptateurs téléphonie/réunion. Les applications navigateur et natives possèdent l’UX de capture/lecture de l’appareil.

## Politique de compatibilité

Pour les plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. conserver l’ancien comportement câblé via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour
  des décomptes compacts, `--owner <id>` pour un Plugin ou propriétaire de compatibilité,
  et `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des
  enregistrements de compatibilité arrivés à échéance, des imports SDK réservés entre
  propriétaires, ou des sous-chemins SDK réservés inutilisés. Le rapport regroupe les
  enregistrements de compatibilité obsolètes par date de suppression, compte les
  références locales dans le code et la documentation, expose les imports SDK réservés
  entre propriétaires, et résume le pont SDK privé de l’hôte mémoire afin que le
  nettoyage de compatibilité reste explicite au lieu de reposer sur des recherches ad hoc.
  Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ;
  les exports d’aides réservées inutilisés doivent être supprimés du SDK public.

  Si un champ de manifeste est encore accepté, les auteurs de plugins peuvent continuer
  à l’utiliser jusqu’à ce que la documentation et les diagnostics indiquent le contraire.
  Le nouveau code doit préférer le remplacement documenté, mais les plugins existants ne
  doivent pas casser lors des versions mineures ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrer les aides de chargement/écriture de configuration d’exécution">
    Les plugins groupés doivent cesser d’appeler
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)` directement. Préférez la configuration
    qui a déjà été passée dans le chemin d’appel actif. Les gestionnaires de longue durée
    qui ont besoin de l’instantané du processus courant peuvent utiliser
    `api.runtime.config.current()`. Les outils d’agent de longue durée doivent utiliser
    `ctx.getRuntimeConfig()` du contexte de l’outil dans `execute`, afin qu’un outil créé
    avant une écriture de configuration voie tout de même la configuration d’exécution
    actualisée.

    Les écritures de configuration doivent passer par les aides transactionnelles et
    choisir une stratégie après écriture :

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Utilisez `afterWrite: { mode: "restart", reason: "..." }` lorsque l’appelant sait
    que le changement nécessite un redémarrage propre du gateway, et
    `afterWrite: { mode: "none", reason: "..." }` uniquement lorsque l’appelant possède
    le suivi et veut délibérément supprimer le planificateur de rechargement.
    Les résultats de mutation incluent un résumé `followUp` typé pour les tests et la
    journalisation ; le gateway reste responsable de l’application ou de la planification
    du redémarrage. `loadConfig` et `writeConfigFile` restent des aides de compatibilité
    obsolètes pour les plugins externes pendant la fenêtre de migration et avertissent une
    fois avec le code de compatibilité `runtime-config-load-write`. Les plugins groupés
    et le code d’exécution du dépôt sont protégés par des garde-fous de scanner dans
    `pnpm check:deprecated-internal-config-api` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation dans un Plugin
    de production échoue directement, les écritures directes de configuration échouent,
    les méthodes du serveur gateway doivent utiliser l’instantané d’exécution de la
    requête, les aides d’envoi/action/client du canal d’exécution doivent recevoir la
    configuration depuis leur frontière, et les modules d’exécution de longue durée
    n’ont droit à aucun appel ambiant `loadConfig()`.

    Le nouveau code de Plugin doit également éviter d’importer le barrel de compatibilité
    large `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit qui
    correspond à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration comme `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertions sur une configuration déjà chargée et recherche de configuration d’entrée de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané d’exécution courant | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Aides de magasin de sessions | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Aides d’exécution de stratégie de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution d’entrée secrète | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les plugins groupés et leurs tests sont protégés par scanner contre le barrel large,
    afin que les imports et les mocks restent locaux au comportement dont ils ont besoin.
    Le barrel large existe toujours pour la compatibilité externe, mais le nouveau code
    ne doit pas en dépendre.

  </Step>

  <Step title="Migrer les extensions de résultats d’outils Pi vers un middleware">
    Les plugins groupés doivent remplacer les gestionnaires de résultats d’outils
    uniquement Pi `api.registerEmbeddedExtensionFactory(...)` par un middleware neutre
    vis-à-vis de l’exécution.

    ```typescript
    // Pi et outils dynamiques de l’exécution Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Mettez à jour le manifeste du Plugin en même temps :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Les plugins externes ne peuvent pas enregistrer de middleware de résultats d’outils,
    car il peut réécrire une sortie d’outil à haut niveau de confiance avant que le
    modèle ne la voie.

  </Step>

  <Step title="Migrer les gestionnaires natifs d’approbation vers des faits de capacité">
    Les plugins de canal capables d’approbation exposent désormais le comportement natif
    d’approbation via `approvalCapability.nativeRuntime` ainsi que le registre partagé
    de contexte d’exécution.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres à l’approbation hors du câblage
      hérité `plugin.auth` / `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de Plugin de canal ;
      déplacez les champs de livraison/natif/rendu vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion de canal ; les hooks
      d’authentification d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets d’exécution détenus par le canal, comme les clients, jetons
      ou applications Bolt, via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage détenus par le Plugin depuis les gestionnaires
      natifs d’approbation ; le cœur possède désormais les avis de routage ailleurs issus
      des résultats de livraison réels
    - Lorsque vous passez `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité
    d’approbation.

  </Step>

  <Step title="Auditer le comportement de fallback des wrappers Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais fermés, sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définissez ceci que pour les appelants de compatibilité fiables qui acceptent
      // intentionnellement un fallback médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du fallback shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre Plugin les imports provenant de l’une ou l’autre surface
    obsolète :

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

    Pour les aides côté hôte, utilisez l’exécution de Plugin injectée au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (exécution injectée)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres aides de pont héritées :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | aides de magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Remplacer les imports infra-runtime larges">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité externe,
    mais le nouveau code doit importer la surface d’aide ciblée dont il a réellement
    besoin :

    | Besoin | Import |
    | --- | --- |
    | Aides de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Aides d’événement Heartbeat et de visibilité | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file de livraison en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Aides sûres de chemins de fichiers/médias locaux | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch tenant compte du répartiteur | `openclaw/plugin-sdk/runtime-fetch` |
    | Aides de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de stratégie de répartiteur SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Aides de payload de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Aides de formatage d’erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Aides de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée de tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins groupés sont protégés par scanner contre `infra-runtime`, afin que le code
    du dépôt ne puisse pas régresser vers le barrel large.

  </Step>

  <Step title="Migrer les aides de routes de canal">
    Le nouveau code de route de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms de clé de route et de cible comparable restent des alias de
    compatibilité pendant la fenêtre de migration, mais les nouveaux plugins doivent
    utiliser les noms de route qui décrivent directement le comportement :

    | Ancienne aide | Aide moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les helpers de routage modernes normalisent `{ channel, to, accountId, threadId }`
    de manière cohérente entre les approbations natives, la suppression des réponses, la
    déduplication entrante, la livraison Cron et le routage des sessions. Si votre Plugin possède
    une grammaire de cible personnalisée, utilisez `resolveChannelRouteTargetWithParser(...)` pour adapter cet
    analyseur au même contrat de cible de routage.

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Common import path table">
  | Chemin d’importation | Objectif | Exportations principales |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant canonique d’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation englobante héritée pour les définitions/générateurs d’entrées de canaux | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canaux | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration | Invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants d’exécution au moment de la configuration | Adaptateurs de correctifs de configuration sûrs à importer, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Assistants d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multi-comptes | Assistants de liste de comptes/configuration/porte d’action |
  | `plugin-sdk/account-id` | Assistants d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte restreints | Assistants de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association par message privé | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse, de l’indication de saisie et de la livraison de source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et assistants d’accès aux messages privés | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux Plugins doivent définir des schémas locaux au Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les Plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation des noms de commande, suppression des espaces dans les descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de stratégie groupe/message privé | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants d’état de compte et de cycle de vie du flux de brouillon | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + générateur d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Assistants de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Assistants de dépendances d’envoi sortant | Recherche `resolveOutboundSendDep` légère sans importer toute l’exécution sortante |
  | `plugin-sdk/outbound-runtime` | Assistants d’exécution sortante | Assistants de livraison sortante, délégué d’identité/envoi, session, formatage et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fil | Assistants de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Assistants hérités de charge utile média | Générateur de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Cale de compatibilité obsolète | Utilitaires d’exécution de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants d’exécution étendus | Assistants d’exécution/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Assistants restreints d’environnement d’exécution | Assistants de journaliseur/environnement d’exécution, délai d’expiration, nouvelle tentative et temporisation exponentielle |
  | `plugin-sdk/plugin-runtime` | Assistants partagés d’exécution de Plugin | Assistants de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hooks | Assistants partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Assistants d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants exec partagés |
  | `plugin-sdk/cli-runtime` | Assistants d’exécution CLI | Assistants de formatage de commande, d’attente et de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway, assistant de démarrage prêt pour la boucle d’événements et assistants de correctif d’état de canal |
  | `plugin-sdk/config-runtime` | Cale de compatibilité de configuration obsolète | Préférez `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation de commandes Telegram à repli stable lorsque la surface de contrat Telegram groupée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Assistants d’invite d’approbation | Charge utile d’approbation exec/Plugin, assistants de capacité/profil d’approbation, routage/exécution d’approbation native et formatage du chemin d’affichage d’approbation structurée |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’autorisation d’approbation | Résolution de l’approbateur, autorisation d’action dans la même conversation |
  | `plugin-sdk/approval-client-runtime` | Assistants client d’approbation | Assistants de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Assistants de Gateway d’approbation | Assistant partagé de résolution de Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal critiques |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants d’exécution plus larges du gestionnaire d’approbation ; préférez les surfaces d’adaptateur/Gateway plus restreintes lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte d’exécution de canal | Assistants génériques d’enregistrement/obtention/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, verrouillage des messages privés, fichiers/chemins bornés à la racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de stratégie SSRF | Assistants de liste d’autorisation d’hôtes et de stratégie de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants d’exécution SSRF | Répartiteur épinglé, fetch protégé, assistants de stratégie SSRF |
  | `plugin-sdk/system-event-runtime` | Assistants d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Assistants Heartbeat | Assistants d’événement et de visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Assistants de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Assistants d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Assistants de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Assistants d’accès aux fichiers | Assistants de chemins de fichiers/médias locaux sûrs |
  | `plugin-sdk/transport-ready-runtime` | Assistants de préparation du transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de verrouillage des diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de formatage d’erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants fetch/proxy enveloppés | `resolveFetch`, assistants proxy, assistants d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de stratégies |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d’entrée de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Assistants de verrouillage des commandes et de surface de commandes | `resolveControlCommandGate`, assistants d’autorisation d’expéditeur, assistants de registre de commandes incluant le formatage dynamique du menu d’arguments |
  | `plugin-sdk/command-status` | Générateurs d’état/aide de commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse d’entrée de secret | Assistants d’entrée de secret |
  | `plugin-sdk/webhook-ingress` | Assistants de requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde du corps Webhook | Assistants de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Distribution entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants restreints de distribution de réponse | Finalisation, distribution de fournisseur et assistants d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de fragments de réponse | Assistants de découpage de texte/markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de magasin de sessions | Assistants de chemin de magasin + de date de mise à jour |
  | `plugin-sdk/state-paths` | Assistants de chemin d’état | Assistants de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Générateurs de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolution de cible | Assistants partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaîne | Assistants de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL sous forme de chaîne à partir d’entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commandes temporisées | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extrait les charges utiles normalisées des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extrait les champs de cible d’envoi canoniques des arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemin temporaire | Assistants partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Enregistreur de sous-système et assistants de masquage |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableau Markdown | Assistants de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Assistants de configuration de fournisseurs locaux/auto-hébergés sélectionnés | Assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI | Mêmes assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Assistants d’authentification d’exécution de fournisseur | Assistants de résolution de clés d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clé d’API de fournisseur | Assistants d’intégration/écriture de profil pour clé d’API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive de fournisseur | Assistants de connexion interactive partagés |
  | `plugin-sdk/provider-selection-runtime` | Assistants de sélection de fournisseur | Sélection de fournisseur configurée ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement de fournisseur | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, assistants de point de terminaison de fournisseur et assistants de normalisation d’identifiants de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Assistants de configuration d’intégration |
  | `plugin-sdk/provider-http` | Assistants HTTP de fournisseur | Assistants génériques HTTP/de capacité de point de terminaison de fournisseur, y compris les assistants de formulaire multipart pour transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants web-fetch de fournisseur | Assistants d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration web-search de fournisseur | Assistants ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat web-search de fournisseur | Assistants ciblés de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/mutateurs d’identifiants à portée définie |
  | `plugin-sdk/provider-web-search` | Assistants web-search de fournisseur | Assistants d’enregistrement/cache/exécution de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schémas Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Assistants d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres assistants d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et assistants partagés d’enveloppe Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur | Assistants de transport natif de fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants multimédias partagés | Assistants de récupération/transformation/stockage multimédia, sondage des dimensions vidéo basé sur ffprobe et générateurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération multimédia | Assistants partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension multimédia | Types de fournisseurs de compréhension multimédia plus exports d’assistants image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Assistants texte partagés | Suppression du texte visible par l’assistant, assistants de rendu/découpage/tableaux Markdown, assistants de masquage, assistants de balises directives, utilitaires de texte sûr et assistants de texte/journalisation connexes |
  | `plugin-sdk/text-chunking` | Assistants de découpage de texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants vocaux | Types de fournisseurs vocaux plus assistants de directive, registre et validation destinés aux fournisseurs, et générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription en temps réel | Types de fournisseurs, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants vocaux en temps réel | Types de fournisseurs, assistants de registre/résolution, assistants de session de pont, files partagées de réponse vocale d’agent, état de transcription/événement, suppression d’écho et assistants rapides de consultation de contexte |
  | `plugin-sdk/image-generation` | Assistants de génération d’images | Types de fournisseurs de génération d’images plus assistants d’actifs image/URL de données et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération de musique | Types de fournisseur/requête/résultat de génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération de vidéos | Types de fournisseur/requête/résultat de génération de vidéos |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération de vidéos | Types de génération de vidéos, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports de préambule de Plugin de canal partagé |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de DM direct | Assistants partagés d’authentification/protection de DM direct |
  | `plugin-sdk/extension-shared` | Assistants d’extension partagés | Primitives d’assistants de canal passif/état et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cible Webhook | Registre de cibles Webhook et assistants d’installation de routes |
  | `plugin-sdk/webhook-path` | Assistants de chemin Webhook | Assistants de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Assistants multimédias web partagés | Assistants de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport Zod | `zod` réexporté pour les consommateurs du SDK de Plugin |
  | `plugin-sdk/memory-core` | Assistants memory-core groupés | Surface d’assistants de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’index/recherche de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte de mémoire | Exports du moteur de fondation de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte de mémoire | Contrats d’embeddings de mémoire, accès au registre, fournisseur local et assistants génériques par lots/distants ; les fournisseurs distants concrets résident dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte de mémoire | Exports du moteur QMD de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte de mémoire | Exports du moteur de stockage de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte de mémoire | Assistants multimodaux de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte de mémoire | Assistants de requête de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte de mémoire | Assistants de secret de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte de mémoire | Assistants de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte de mémoire | Assistants d’état de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte de mémoire | Assistants d’exécution CLI de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution cœur de l’hôte de mémoire | Assistants d’exécution cœur de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichier/exécution de l’hôte de mémoire | Assistants de fichier/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution cœur de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants d’exécution cœur de l’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichier/exécution de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants de fichier/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-markdown` | Assistants Markdown gérés | Assistants Markdown géré partagés pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche de mémoire active | Façade d’exécution paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias d’état de l’hôte de mémoire | Alias indépendant du fournisseur pour les assistants d’état de l’hôte de mémoire |
  | `plugin-sdk/testing` | Utilitaires de test | Barrel hérité de compatibilité large ; privilégiez les sous-chemins de test ciblés tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau constitue intentionnellement le sous-ensemble commun de migration, pas la surface complète du SDK. La liste complète des plus de 200 points d’entrée se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les points d’extension d’aide réservés aux plugins intégrés ont été retirés de la carte d’export du SDK public, à l’exception des façades de compatibilité explicitement documentées, comme le shim obsolète `plugin-sdk/discord` conservé pour le paquet publié `@openclaw/discord@2026.3.13`. Les assistants propres à un propriétaire résident dans le paquet du Plugin propriétaire ; le comportement partagé de l’hôte doit passer par des contrats SDK génériques comme `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus restreint qui correspond à la tâche. Si vous ne trouvez pas d’export, consultez la source dans `src/plugin-sdk/` ou demandez aux mainteneurs quel contrat générique doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent à l’ensemble du SDK de Plugin, au contrat fournisseur, à la surface d’exécution et au manifeste. Chacune fonctionne encore aujourd’hui, mais sera supprimée dans une prochaine version majeure. L’entrée sous chaque élément associe l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="générateurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports - simplement importés depuis le sous-chemin plus restreint. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Assistants de filtrage des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` - renvoie un
    seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Shim d’exécution de canal et assistants d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    plugins de canal. Ne l’importez pas depuis du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les assistants `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    dépréciés en même temps que les exports bruts de canal « actions ». Exposez plutôt
    les capacités via la surface sémantique `presentation` - les plugins de canal
    déclarent ce qu’ils affichent (cartes, boutons, sélecteurs) plutôt que les noms
    d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Assistant tool() du fournisseur de recherche web → createTool() sur le Plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le Plugin fournisseur.
    OpenClaw n’a plus besoin de l’assistant SDK pour enregistrer le wrapper d’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de prompt
    plate en texte brut à partir des messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur. Les
    plugins de canal attachent les métadonnées de routage (fil, sujet, réponse à,
    réactions) sous forme de champs typés au lieu de les concaténer dans une chaîne de
    prompt. L’assistant `formatAgentEnvelope(...)` reste pris en charge pour les
    enveloppes synthétisées destinées à l’assistant, mais les enveloppes entrantes en
    texte brut sont en voie de suppression.

    Zones concernées : `inbound_claim`, `message_received`, et tout Plugin de canal
    personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="Types de découverte fournisseur → types de catalogue fournisseur">
    Quatre alias de types de découverte sont désormais de fins wrappers autour des
    types de l’ère catalogue :

    | Ancien alias              | Nouveau type               |
    | ------------------------- | -------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`     |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`   |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`    |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`    |

    Ainsi que l’ancien sac statique `ProviderCapabilities` - les plugins fournisseurs
    doivent utiliser des hooks fournisseur explicites comme `buildReplayPolicy`,
    `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="Hooks de politique de raisonnement → resolveThinkingProfile">
    **Ancien** (trois hooks distincts sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un seul `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et une
    liste de niveaux classée. OpenClaw rétrograde automatiquement les anciennes valeurs
    stockées selon le rang du profil.

    Implémentez un seul hook au lieu de trois. Les hooks hérités continuent de
    fonctionner pendant la fenêtre de dépréciation, mais ne sont pas composés avec le
    résultat du profil.

  </Accordion>

  <Accordion title="Repli fournisseur OAuth externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans déclarer le
    fournisseur dans le manifeste du Plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste du Plugin
    **et** implémentez `resolveExternalAuthProfiles(...)`. L’ancien chemin de « repli
    d’authentification » émet un avertissement à l’exécution et sera supprimé.

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
    `setup.providers[].envVars` sur le manifeste. Cela consolide les métadonnées
    d’environnement de configuration/statut en un seul endroit et évite de démarrer
    l’exécution du Plugin uniquement pour répondre aux recherches de variables
    d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement du Plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API d’état mémoire -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les assistants mémoire additifs
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas affectés.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux alias de types hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                       | Nouveau                         |
    | ---------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    La méthode d’exécution `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur de flux de tâches actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’exécution de mutation TaskFlow
    gérée pour les plugins qui créent, mettent à jour, annulent ou exécutent des tâches
    enfants depuis un flux. Utilisez `runtime.tasks.flows` lorsque le Plugin n’a besoin
    que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabriques d’extension intégrées → middleware de résultat d’outil d’agent">
    Couvert dans « Comment migrer → Migrer les extensions de résultat d’outil Pi vers
    le middleware » ci-dessus. Inclus ici par souci d’exhaustivité : le chemin Pi
    uniquement supprimé `api.registerEmbeddedExtensionFactory(...)` est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste d’exécution explicite
    dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est désormais un
    alias d’une ligne pour `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations au niveau des extensions (dans les plugins de canal/fournisseur
intégrés sous `extensions/`) sont suivies dans leurs propres barrels `api.ts` et
`runtime-api.ts`. Elles n’affectent pas les contrats de plugins tiers et ne sont pas
listées ici. Si vous consommez directement le barrel local d’un Plugin intégré, lisez
les commentaires de dépréciation dans ce barrel avant la mise à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements à l’exécution     |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Suppression temporaire des avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Connexe

- [Bien démarrer](/fr/plugins/building-plugins) - créez votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports de sous-chemins
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - créer des plugins de canal
- [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins) - créer des plugins fournisseurs
- [Internes des plugins](/fr/plugins/architecture) - plongée approfondie dans l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) - référence du schéma de manifeste
