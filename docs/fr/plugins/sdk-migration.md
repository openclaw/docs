---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le SDK de Plugin moderne
title: Migration du SDK de Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture
de Plugins moderne avec des imports ciblés et documentés. Si votre Plugin a été
créé avant la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugins fournissait deux surfaces très ouvertes qui
permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un
point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** - un import unique qui réexportait des
  dizaines d’assistants. Il a été introduit pour maintenir le fonctionnement des
  anciens Plugins basés sur des hooks pendant la construction de la nouvelle
  architecture de Plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un large module d’agrégation
  d’assistants runtime qui mélangeait événements système, état Heartbeat, files
  de livraison, assistants fetch/proxy, assistants de fichiers, types
  d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large module d’agrégation de
  compatibilité de configuration qui conserve encore des assistants directs de
  chargement/écriture dépréciés pendant la fenêtre de migration.
- **`openclaw/extension-api`** - un pont qui donnait aux Plugins un accès direct
  à des assistants côté hôte comme le lanceur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension groupée
  réservé au lanceur intégré, désormais supprimé, qui pouvait observer des
  événements du lanceur intégré tels que `tool_result`.

Les larges surfaces d’import sont désormais **dépréciées**. Elles fonctionnent
encore à l’exécution, mais les nouveaux Plugins ne doivent pas les utiliser, et
les Plugins existants doivent migrer avant que la prochaine version majeure ne
les supprime. L’API d’enregistrement de fabrique d’extensions réservée au
lanceur intégré a été supprimée ; utilisez plutôt un middleware de résultats
d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans
le même changement qui introduit son remplacement. Les changements de contrat
cassants doivent d’abord passer par un adaptateur de compatibilité, des
diagnostics, de la documentation et une fenêtre de dépréciation. Cela s’applique
aux imports du SDK, aux champs de manifeste, aux API de configuration, aux hooks
et au comportement d’enregistrement runtime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version
  majeure. Les Plugins qui importent encore depuis ces surfaces cesseront de
  fonctionner quand cela arrivera. Les anciens enregistrements de fabriques
  d’extensions intégrées ne se chargent déjà plus.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer un assistant chargeait des dizaines de modules
  sans rapport
- **Dépendances circulaires** - les réexports larges facilitaient la création de
  cycles d’import
- **Surface d’API peu claire** - aucun moyen de savoir quels exports étaient
  stables ou internes

Le SDK de Plugins moderne corrige cela : chaque chemin d’import
(`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome avec un objectif
clair et un contrat documenté.

Les points de commodité hérités des fournisseurs pour les canaux groupés ont
également disparu. Les points d’assistance marqués par canal étaient des
raccourcis privés de mono-repo, pas des contrats de Plugins stables. Utilisez
plutôt des sous-chemins SDK génériques et étroits. Dans l’espace de travail des
Plugins groupés, gardez les assistants détenus par le fournisseur dans le
`api.ts` ou le `runtime-api.ts` propre à ce Plugin.

Exemples actuels de fournisseurs groupés :

- Anthropic conserve les assistants de flux propres à Claude dans son propre
  point `api.ts` / `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseurs, les assistants de modèle
  par défaut et les constructeurs de fournisseurs temps réel dans son propre
  `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les assistants
  d’onboarding/configuration dans son propre `api.ts`

## Plan de migration Talk et voix temps réel

Le code Talk pour voix temps réel, téléphonie, réunions et navigateur passe
d’une comptabilité des tours locale à la surface à un contrôleur de session Talk
partagé exporté par `openclaw/plugin-sdk/realtime-voice`. Le nouveau contrôleur
possède l’enveloppe commune des événements Talk, l’état de tour actif, l’état de
capture, l’état d’audio de sortie, l’historique récent des événements et le
rejet des tours obsolètes. Les Plugins fournisseurs doivent continuer à posséder
les sessions temps réel propres aux fournisseurs ; les Plugins de surface doivent
continuer à posséder les particularités de capture, de lecture, de téléphonie et
de réunion.

Cette migration Talk est volontairement cassante et nette :

1. Garder le contrôleur partagé et les primitives runtime dans
   `plugin-sdk/realtime-voice`.
2. Déplacer les surfaces groupées vers le contrôleur partagé : relais navigateur,
   transfert de salle gérée, temps réel d’appel vocal, STT en streaming d’appel
   vocal, Google Meet temps réel et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*`
   et `talk.client.*`.
4. Annoncer un seul canal d’événements Talk en direct dans
   `hello-ok.features.events` du Gateway : `talk.event`.
5. Supprimer l’ancien endpoint HTTP temps réel et tout chemin de surcharge des
   instructions au moment de la requête.

Le nouveau code ne doit pas appeler `createTalkEventSequencer(...)` directement,
sauf s’il implémente un adaptateur de bas niveau ou une fixture de test.
Préférez le contrôleur partagé afin que les événements liés à un tour ne puissent
pas être émis sans identifiant de tour, que les appels `turnEnd` / `turnCancel`
obsolètes ne puissent pas effacer un tour actif plus récent, et que les
événements de cycle de vie d’audio de sortie restent cohérents entre téléphonie,
réunions, relais navigateur, transfert de salle gérée et clients Talk natifs.

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

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Les sessions WebRTC/provider-websocket détenues par le navigateur utilisent
`talk.client.create`, car le navigateur possède la négociation du fournisseur et
le transport média, tandis que le Gateway possède les identifiants, les
instructions et la politique d’outils. `talk.session.*` est la surface commune
gérée par le Gateway pour les sessions temps réel gateway-relay, les
transcriptions gateway-relay et les sessions STT/TTS natives de salle gérée.

Les configurations héritées qui plaçaient les sélecteurs temps réel à côté de
`talk.provider` / `talk.providers` doivent être réparées avec
`openclaw doctor --fix` ; le runtime Talk ne réinterprète pas la configuration de
fournisseur speech/TTS comme configuration de fournisseur temps réel.

Les combinaisons prises en charge par `talk.session.create` sont
volontairement réduites :

| Mode            | Transport       | Cerveau         | Propriétaire       | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio fournisseur full-duplex relayé via le Gateway ; les appels d’outils sont routés via l’outil agent-consult.   |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription. |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de style push-to-talk et talkie-walkie où le client possède capture/lecture et le Gateway possède l’état de tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode salle réservé aux administrateurs pour les surfaces de première partie fiables qui exécutent directement les actions d’outil du Gateway. |

Table de correspondance des méthodes supprimées :

| Ancien                           | Nouveau                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Le vocabulaire de contrôle unifié est également volontairement étroit :

  | Méthode                         | S’applique à                                            | Contrat                                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajouter un segment audio PCM en base64 à la session du fournisseur détenue par la même connexion Gateway.                                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarrer un tour utilisateur en salle gérée.                                                                                                                                                             |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Terminer le tour actif après validation des tours obsolètes.                                                                                                                                             |
  | `talk.session.cancelTurn`       | toutes les sessions détenues par le Gateway             | Annuler le travail de capture, fournisseur, agent et TTS actif pour un tour.                                                                                                                             |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrêter la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Terminer un appel d’outil fournisseur émis par le relais ; passer `options.willContinue` pour une sortie intermédiaire ou `options.suppressResponse` pour satisfaire l’appel sans autre réponse assistant. |
  | `talk.session.steer`            | sessions Talk adossées à un agent                       | Envoyer une commande vocale `status`, `steer`, `cancel` ou `followup` à l’exécution intégrée active résolue depuis la session Talk.                                                                      |
  | `talk.session.close`            | toutes les sessions unifiées                            | Arrêter les sessions de relais ou révoquer l’état de salle gérée, puis oublier l’id de session unifiée.                                                                                                  |

  N’introduisez pas de cas particuliers de fournisseur ou de plateforme dans le noyau pour que cela fonctionne.
  Le noyau détient la sémantique des sessions Talk. Les Plugins fournisseurs détiennent la configuration des sessions vendeur.
  Les appels vocaux et Google Meet détiennent les adaptateurs de téléphonie/réunion. Le navigateur et les applications natives
  détiennent l’UX de capture/lecture des appareils.

  ## Politique de compatibilité

  Pour les Plugins externes, le travail de compatibilité suit cet ordre :

  1. ajouter le nouveau contrat
  2. conserver l’ancien comportement câblé via un adaptateur de compatibilité
  3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
  4. couvrir les deux chemins dans les tests
  5. documenter la dépréciation et le chemin de migration
  6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour des
  compteurs compacts, `--owner <id>` pour un Plugin ou propriétaire de compatibilité, et
  `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des
  enregistrements de compatibilité échus, des imports SDK réservés entre propriétaires, ou des sous-chemins SDK réservés inutilisés. Le rapport regroupe les enregistrements de
  compatibilité dépréciés par date de suppression, compte les références locales de code/docs,
  fait remonter les imports SDK réservés entre propriétaires, et résume le pont SDK privé
  memory-host afin que le nettoyage de compatibilité reste explicite au lieu de
  s’appuyer sur des recherches ad hoc. Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ;
  les exports d’assistants réservés inutilisés doivent être retirés du SDK public.

  Si un champ de manifeste est encore accepté, les auteurs de Plugins peuvent continuer à l’utiliser jusqu’à ce que
  les docs et diagnostics indiquent le contraire. Le nouveau code doit préférer le remplacement documenté, mais les Plugins existants ne doivent pas casser lors des versions mineures ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Les Plugins intégrés doivent cesser d’appeler
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)` directement. Préférez la configuration qui a
    déjà été transmise au chemin d’appel actif. Les gestionnaires longue durée qui ont besoin de
    l’instantané du processus courant peuvent utiliser `api.runtime.config.current()`. Les outils
    d’agent longue durée doivent utiliser `ctx.getRuntimeConfig()` du contexte d’outil dans
    `execute`, afin qu’un outil créé avant une écriture de configuration voie quand même la
    configuration runtime rafraîchie.

    Les écritures de configuration doivent passer par les assistants transactionnels et choisir une
    politique post-écriture :

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
    `afterWrite: { mode: "none", reason: "..." }` uniquement lorsque l’appelant détient le
    suivi et veut délibérément supprimer le planificateur de rechargement.
    Les résultats de mutation incluent un résumé `followUp` typé pour les tests et la journalisation ;
    le Gateway reste responsable de l’application ou de la planification du redémarrage.
    `loadConfig` et `writeConfigFile` restent des assistants de compatibilité dépréciés
    pour les Plugins externes pendant la fenêtre de migration et avertissent une fois avec
    le code de compatibilité `runtime-config-load-write`. Les Plugins intégrés et le code
    runtime du dépôt sont protégés par des garde-fous de scan dans
    `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation de Plugin de production
    échoue directement, les écritures directes de configuration échouent, les méthodes serveur Gateway doivent utiliser
    l’instantané runtime de la requête, les assistants runtime d’envoi/action/client de canal
    doivent recevoir la configuration depuis leur frontière, et les modules runtime longue durée n’ont
    aucun appel ambiant `loadConfig()` autorisé.

    Le nouveau code de Plugin doit aussi éviter d’importer le vaste barrel de compatibilité
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit qui correspond
    à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration comme `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané runtime courant | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Assistants de stockage de session | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Assistants runtime de politique de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution d’entrée secrète | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les Plugins intégrés et leurs tests sont protégés par scanner contre le vaste
    barrel afin que les imports et mocks restent locaux au comportement dont ils ont besoin. Le vaste
    barrel existe encore pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Les Plugins intégrés doivent remplacer les gestionnaires de résultats d’outils
    `api.registerEmbeddedExtensionFactory(...)` propres au runner intégré par un middleware
    neutre vis-à-vis du runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Mettez à jour le manifeste du Plugin en même temps :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Les Plugins installés peuvent aussi enregistrer un middleware de résultats d’outils lorsqu’ils sont
    explicitement activés et déclarent chaque runtime ciblé dans
    `contracts.agentToolResultMiddleware`. Les enregistrements de middleware installé non déclarés
    sont rejetés.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Les Plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte runtime.

    Changements clés :

    - Remplacer `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacer l’authentification/la livraison propres aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été retiré du contrat public des Plugins de canal ;
      déplacer les champs de livraison/natif/rendu vers `approvalCapability`
    - `plugin.auth` reste uniquement pour les flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation qui s’y trouvent ne sont plus lus par le noyau
    - Enregistrer les objets runtime détenus par le canal, comme les clients, jetons ou applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - Ne pas envoyer d’avis de reroutage détenus par le Plugin depuis les gestionnaires d’approbation natifs ;
      le noyau détient désormais les avis routed-elsewhere issus des résultats de livraison réels
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournir une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
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

    Si votre appelant ne dépend pas intentionnellement du fallback shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Find deprecated imports">
    Recherchez dans votre Plugin les imports provenant de l’une ou l’autre surface dépréciée :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
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

    Pour les assistants côté hôte, utilisez le runtime de Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
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
    | assistants du magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Remplacer les imports infra-runtime larges">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface d’assistants ciblée
    dont il a réellement besoin :

    | Besoin | Import |
    | --- | --- |
    | Assistants de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Assistants de réveil, d’événement et de visibilité Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file de livraison en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité du canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Assistants sûrs pour les chemins de fichiers locaux/médias | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch compatible avec le répartiteur | `openclaw/plugin-sdk/runtime-fetch` |
    | Assistants de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique de répartiteur SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Assistants de charge utile de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Assistants de formatage d’erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Assistants de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins groupés sont protégés par un scanner contre `infra-runtime`, donc le code du dépôt
    ne peut pas régresser vers le barrel large.

  </Step>

  <Step title="Migrer les assistants de routage de canal">
    Le nouveau code de routage de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms route-key et comparable-target restent comme alias de compatibilité
    pendant la fenêtre de migration, mais les nouveaux plugins doivent utiliser les noms
    de routage qui décrivent directement le comportement :

    | Ancien assistant | Assistant moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les assistants de routage modernes normalisent `{ channel, to, accountId, threadId }`
    de façon cohérente entre les approbations natives, la suppression des réponses, la déduplication entrante,
    la livraison cron et le routage de session.

    N’ajoutez pas de nouvelles utilisations de `ChannelMessagingAdapter.parseExplicitTarget` ni
    des assistants de route chargée adossés à l’analyseur (`parseExplicitTargetForLoadedChannel`
    ou `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` depuis `plugin-sdk/channel-route`.
    Ces hooks sont obsolètes et ne restent que pour les plugins plus anciens pendant la
    fenêtre de migration. Les nouveaux plugins de canal doivent utiliser
    `messaging.targetResolver.resolveTarget(...)` pour la normalisation des identifiants de cible
    et le repli en cas d’absence dans l’annuaire, `messaging.inferTargetChatType(...)` lorsque le noyau
    a besoin d’un type de pair anticipé, et `messaging.resolveOutboundSessionRoute(...)`
    pour l’identité de session et de fil native au fournisseur.

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Common import path table">
  | Chemin d’importation | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Fonction d’aide canonique pour l’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Fonction d’aide pour l’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés pour les entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Fonctions d’aide partagées pour l’assistant de configuration | Traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Fonctions d’aide runtime pendant la configuration | `createSetupTranslator`, adaptateurs de correctifs de configuration sûrs à l’importation, fonctions d’aide pour les notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Alias d’adaptateur de configuration obsolète | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Fonctions d’aide pour l’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Fonctions d’aide multi-compte | Fonctions d’aide pour les listes de comptes, la configuration et les barrières d’action |
  | `plugin-sdk/account-id` | Fonctions d’aide pour les identifiants de compte | `DEFAULT_ACCOUNT_ID`, normalisation des identifiants de compte |
  | `plugin-sdk/account-resolution` | Fonctions d’aide de recherche de compte | Recherche de compte + fonctions d’aide de repli par défaut |
  | `plugin-sdk/account-helpers` | Fonctions d’aide ciblées pour les comptes | Fonctions d’aide de liste de comptes/d’action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse, indication de saisie et câblage de livraison source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et fonctions d’aide d’accès DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux plugins doivent définir des schémas locaux au Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Fonctions d’aide pour la configuration des commandes Telegram | Normalisation des noms de commande, nettoyage des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des stratégies de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Fonctions d’aide pour les enveloppes entrantes | Fonctions d’aide partagées pour la route + le générateur d’enveloppe |
  | `plugin-sdk/channel-inbound` | Fonctions d’aide pour la réception entrante | Construction de contexte, formatage, racines, exécuteurs, distribution préparée des réponses et prédicats de distribution |
  | `plugin-sdk/messaging-targets` | Chemin d’importation obsolète pour l’analyse des cibles | Utilisez `plugin-sdk/channel-targets` pour les fonctions d’aide génériques d’analyse de cible, `plugin-sdk/channel-route` pour la comparaison de routes, et `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` appartenant au Plugin pour la résolution de cibles spécifique au fournisseur |
  | `plugin-sdk/outbound-media` | Fonctions d’aide pour les médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Fonctions d’aide pour le cycle de vie des messages sortants | Adaptateurs de messages, accusés de réception, fonctions d’aide d’envoi durable, fonctions d’aide d’aperçu/streaming en direct, options de réponse, fonctions d’aide de cycle de vie, identité sortante et planification de charge utile |
  | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Fonctions d’aide pour les liaisons de fil | Fonctions d’aide pour le cycle de vie des liaisons de fil et les adaptateurs |
  | `plugin-sdk/agent-media-payload` | Fonctions d’aide héritées pour les charges utiles de médias | Générateur de charges utiles de médias d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires runtime de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Fonctions d’aide runtime générales | Fonctions d’aide runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Fonctions d’aide ciblées pour l’environnement runtime | Journaliseur/environnement runtime, délai d’expiration, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Fonctions d’aide partagées pour le runtime de Plugin | Fonctions d’aide pour commandes/hooks/http/interactif de Plugin |
  | `plugin-sdk/hook-runtime` | Fonctions d’aide pour le pipeline de hooks | Fonctions d’aide partagées pour le pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Fonctions d’aide pour le runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Fonctions d’aide pour les processus | Fonctions d’aide exec partagées |
  | `plugin-sdk/cli-runtime` | Fonctions d’aide runtime CLI | Formatage de commandes, attentes, fonctions d’aide de version |
  | `plugin-sdk/gateway-runtime` | Fonctions d’aide Gateway | Client Gateway, fonction d’aide de démarrage prêt pour la boucle d’événements et fonctions d’aide pour les correctifs d’état de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Fonctions d’aide pour les commandes Telegram | Fonctions d’aide de validation des commandes Telegram stables au repli quand la surface de contrat Telegram groupée est indisponible |
  | `plugin-sdk/approval-runtime` | Fonctions d’aide pour les invites d’approbation | Charge utile d’approbation exec/Plugin, fonctions d’aide de capacité/profil d’approbation, routage/runtime d’approbation natif et formatage du chemin d’affichage d’approbation structurée |
  | `plugin-sdk/approval-auth-runtime` | Fonctions d’aide pour l’authentification d’approbation | Résolution de l’approbateur, authentification d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Fonctions d’aide pour le client d’approbation | Fonctions d’aide natives de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Fonctions d’aide pour la livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Fonctions d’aide pour le Gateway d’approbation | Fonction d’aide partagée de résolution du Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Fonctions d’aide pour les adaptateurs d’approbation | Fonctions d’aide légères de chargement d’adaptateur d’approbation natif pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Fonctions d’aide pour les gestionnaires d’approbation | Fonctions d’aide runtime plus larges pour les gestionnaires d’approbation ; préférez les jonctions plus ciblées d’adaptateur/Gateway quand elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Fonctions d’aide pour les cibles d’approbation | Fonctions d’aide natives de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Fonctions d’aide pour les réponses d’approbation | Fonctions d’aide pour les charges utiles de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Fonctions d’aide pour le contexte runtime de canal | Fonctions d’aide génériques register/get/watch pour le contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Fonctions d’aide de sécurité | Fonctions d’aide partagées de confiance, barrière DM, fichiers/chemins bornés par racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Fonctions d’aide pour la stratégie SSRF | Fonctions d’aide pour liste d’autorisation d’hôtes et stratégie de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Fonctions d’aide runtime SSRF | Dispatcher épinglé, fetch protégé, fonctions d’aide pour la stratégie SSRF |
  | `plugin-sdk/system-event-runtime` | Fonctions d’aide pour les événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Fonctions d’aide Heartbeat | Fonctions d’aide pour réveil, événement et visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Fonctions d’aide pour les files de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Fonctions d’aide pour l’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Fonctions d’aide de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Fonctions d’aide pour l’accès aux fichiers | Fonctions d’aide pour chemins de fichiers/médias locaux sûrs |
  | `plugin-sdk/transport-ready-runtime` | Fonctions d’aide pour la disponibilité du transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Fonctions d’aide pour la stratégie d’approbation exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Fonctions d’aide pour les caches bornés | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Fonctions d’aide pour les barrières de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Fonctions d’aide de formatage des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, fonctions d’aide pour le graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Fonctions d’aide pour fetch/proxy encapsulés | `resolveFetch`, fonctions d’aide de proxy, fonctions d’aide pour les options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Fonctions d’aide de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Fonctions d’aide pour les nouvelles tentatives | `RetryConfig`, `retryAsync`, exécuteurs de stratégie |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation et mappage d’entrées | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Barrières de commande et fonctions d’aide pour la surface de commande | `resolveControlCommandGate`, fonctions d’aide d’autorisation d’expéditeur, fonctions d’aide de registre de commandes incluant le formatage dynamique des menus d’arguments |
  | `plugin-sdk/command-status` | Générateurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Fonctions d’aide pour les entrées secrètes |
  | `plugin-sdk/webhook-ingress` | Fonctions d’aide pour les requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Fonctions d’aide de garde du corps Webhook | Fonctions d’aide de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime de réponse partagé | Distribution entrante, heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Fonctions d’aide ciblées pour la distribution de réponses | Finalisation, distribution fournisseur et fonctions d’aide d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Fonctions d’aide pour l’historique des réponses | `createChannelHistoryWindow` ; exportations de compatibilité obsolètes pour les fonctions d’aide de map, telles que `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Fonctions d’aide pour les morceaux de réponse | Fonctions d’aide de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Fonctions d’aide pour le magasin de sessions | Fonctions d’aide de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Fonctions d’aide pour les chemins d’état | Fonctions d’aide pour les répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Utilitaires de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilitaires de normalisation des clés de session |
  | `plugin-sdk/status-helpers` | Utilitaires de statut de canal | Générateurs de résumés de statut de canal/compte, valeurs par défaut d’état d’exécution, utilitaires de métadonnées de problèmes |
  | `plugin-sdk/target-resolver-runtime` | Utilitaires de résolution de cible | Utilitaires partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation de chaînes | Utilitaires de normalisation de slugs/chaînes |
  | `plugin-sdk/request-url` | Utilitaires d’URL de requête | Extraire les URL sous forme de chaînes depuis des entrées semblables à des requêtes |
  | `plugin-sdk/run-command` | Utilitaires de commande chronométrée | Exécuteur de commandes chronométrées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres courants pour outils/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Utilitaires de chemin temporaire | Utilitaires partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Utilitaires de journalisation | Journaliseur de sous-système et utilitaires de caviardage |
  | `plugin-sdk/markdown-table-runtime` | Utilitaires de tableaux Markdown | Utilitaires de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse aux messages | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Utilitaires sélectionnés de configuration de fournisseur local/auto-hébergé | Utilitaires de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Utilitaires ciblés de configuration de fournisseur auto-hébergé compatible OpenAI | Mêmes utilitaires de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/provider-auth-runtime` | Utilitaires d’authentification de fournisseur à l’exécution | Utilitaires de résolution de clés d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Utilitaires de configuration de clés d’API de fournisseur | Utilitaires d’intégration/écriture de profil de clé d’API |
  | `plugin-sdk/provider-auth-result` | Utilitaires de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Utilitaires de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Utilitaires de variables d’environnement de fournisseur | Utilitaires de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Utilitaires partagés de modèle/rejeu de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de rejeu, utilitaires de point de terminaison de fournisseur et utilitaires de normalisation d’identifiants de modèle |
  | `plugin-sdk/provider-catalog-shared` | Utilitaires partagés de catalogue de fournisseurs | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Utilitaires de configuration d’intégration |
  | `plugin-sdk/provider-http` | Utilitaires HTTP de fournisseur | Utilitaires génériques HTTP/capacité de point de terminaison de fournisseur, y compris les utilitaires de formulaire multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Utilitaires web-fetch de fournisseur | Utilitaires d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilitaires de configuration web-search de fournisseur | Utilitaires étroits de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat web-search de fournisseur | Utilitaires étroits de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/mutateurs d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Utilitaires web-search de fournisseur | Utilitaires d’enregistrement/cache/exécution de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Utilitaires de compatibilité outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schéma + diagnostics DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Utilitaires d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres utilitaires d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Utilitaires d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux et utilitaires partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport de fournisseur | Utilitaires de transport natif de fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilitaires multimédias partagés | Utilitaires de récupération/transformation/stockage multimédia, détection de dimensions vidéo basée sur ffprobe et générateurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Utilitaires partagés de génération multimédia | Utilitaires partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Utilitaires de compréhension multimédia | Types de fournisseurs de compréhension multimédia plus exports d’utilitaires image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Export de compatibilité textuelle large obsolète | Utilisez `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Utilitaires de découpage de texte | Utilitaire de découpage de texte sortant |
  | `plugin-sdk/speech` | Utilitaires de parole | Types de fournisseurs de parole plus utilitaires de directive, registre et validation destinés aux fournisseurs, et générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau de parole partagé | Types de fournisseurs de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Utilitaires de transcription en temps réel | Types de fournisseurs, utilitaires de registre et utilitaire partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Utilitaires vocaux en temps réel | Types de fournisseurs, utilitaires de registre/résolution, utilitaires de session de pont, files partagées de réponse vocale d’agent, contrôle vocal de l’exécution active, santé des transcriptions/événements, suppression d’écho, correspondance des questions de consultation, coordination de consultation forcée, suivi du contexte de tour, suivi de l’activité de sortie et utilitaires de consultation rapide du contexte |
  | `plugin-sdk/image-generation` | Utilitaires de génération d’images | Types de fournisseurs de génération d’images plus utilitaires d’URL d’actif/données d’image et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et utilitaires de registre |
  | `plugin-sdk/music-generation` | Utilitaires de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, utilitaires de basculement, recherche de fournisseur et analyse de références de modèle |
  | `plugin-sdk/video-generation` | Utilitaires de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, utilitaires de basculement, recherche de fournisseur et analyse de références de modèle |
  | `plugin-sdk/interactive-runtime` | Utilitaires de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives étroites de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Utilitaires d’écriture de configuration de canal | Utilitaires d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports partagés de préambule de Plugin de canal |
  | `plugin-sdk/channel-status` | Utilitaires de statut de canal | Utilitaires partagés d’instantané/résumé de statut de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilitaires de configuration de liste d’autorisation | Utilitaires de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Utilitaires d’accès de groupe | Utilitaires partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes | Utilisez `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Utilitaires de garde de DM direct | Utilitaires étroits de politique de garde pré-crypto |
  | `plugin-sdk/extension-shared` | Utilitaires d’extension partagés | Primitives de canal passif/statut et d’utilitaires de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Utilitaires de cible Webhook | Registre de cibles Webhook et utilitaires d’installation de routes |
  | `plugin-sdk/webhook-path` | Alias obsolète de chemin Webhook | Utilisez `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Utilitaires web multimédias partagés | Utilitaires de chargement multimédia distant/local |
  | `plugin-sdk/zod` | Réexport de compatibilité Zod obsolète | Importez `zod` directement depuis `zod` |
  | `plugin-sdk/memory-core` | Utilitaires memory-core groupés | Surface d’utilitaires de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’index/recherche mémoire |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registre d’embeddings de mémoire | Utilitaires légers de registre de fournisseurs d’embeddings de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation d’hôte mémoire | Exports du moteur fondation d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings d’hôte mémoire | Contrats d’embeddings de mémoire, accès au registre, fournisseur local et utilitaires génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD d’hôte mémoire | Exports du moteur QMD d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage d’hôte mémoire | Exports du moteur de stockage d’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Utilitaires multimodaux d’hôte mémoire | Utilitaires multimodaux d’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Utilitaires de requête d’hôte mémoire | Utilitaires de requête d’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Utilitaires de secret d’hôte mémoire | Utilitaires de secret d’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias d’événement mémoire obsolète | Utilisez `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Utilitaires de statut d’hôte mémoire | Utilitaires de statut d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI d’hôte mémoire | Utilitaires d’exécution CLI d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution noyau d’hôte mémoire | Utilitaires d’exécution noyau d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilitaires de fichier/exécution d’hôte mémoire | Utilitaires de fichier/exécution d’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution noyau d’hôte mémoire | Alias indépendant du fournisseur pour les utilitaires d’exécution noyau d’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements d’hôte mémoire | Alias indépendant du fournisseur pour les utilitaires de journal d’événements d’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias obsolète de fichier/exécution mémoire | Utilisez `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Utilitaires Markdown gérés | Utilitaires partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution du gestionnaire de recherche Active Memory à chargement différé |
  | `plugin-sdk/memory-host-status` | Alias obsolète de statut d’hôte mémoire | Utilisez `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Barrel de compatibilité obsolète local au dépôt ; utilisez des sous-chemins de test ciblés locaux au dépôt tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau est intentionnellement le sous-ensemble commun de migration, et non la surface
complète du SDK. L’inventaire du point d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de package sont générés à partir
du sous-ensemble public.

Les points d’extension auxiliaires réservés aux plugins groupés ont été retirés de la carte
d’exports publique du SDK, sauf pour les façades de compatibilité explicitement documentées,
comme le shim obsolète `plugin-sdk/discord` conservé pour le package publié
`@openclaw/discord@2026.3.13`. Les helpers propres à un propriétaire résident dans le
package du plugin propriétaire; le comportement partagé de l’hôte doit passer par des
contrats SDK génériques comme `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
et `plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus étroit qui correspond au besoin. Si vous ne trouvez pas d’export,
consultez la source dans `src/plugin-sdk/` ou demandez aux mainteneurs quel contrat générique
doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent à l’ensemble du SDK de plugin, du contrat de
fournisseur, de la surface d’exécution et du manifeste. Chacune fonctionne encore aujourd’hui,
mais sera supprimée dans une future version majeure. L’entrée sous chaque élément associe
l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="générateurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports - simplement importés depuis le sous-chemin plus étroit. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helpers de filtrage des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` - renvoie un
    seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="shim d’exécution de canal et helpers d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    plugins de canal. Ne l’importez pas dans du nouveau code; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les helpers `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    obsolètes en même temps que les exports de canal « actions » bruts. Exposez les
    capacités via la surface sémantique `presentation` à la place - les plugins de
    canal déclarent ce qu’ils affichent (cartes, boutons, listes de sélection) plutôt
    que les noms d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="helper tool() de fournisseur de recherche Web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin fournisseur.
    OpenClaw n’a plus besoin du helper SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour créer une enveloppe d’invite en
    texte brut plat à partir de messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur.
    Les plugins de canal joignent les métadonnées de routage (fil, sujet, réponse à,
    réactions) comme champs typés au lieu de les concaténer dans une chaîne d’invite.
    Le helper `formatAgentEnvelope(...)` reste pris en charge pour les enveloppes
    synthétisées destinées à l’assistant, mais les enveloppes entrantes en texte brut
    sont en voie de retrait.

    Zones affectées : `inbound_claim`, `message_received` et tout plugin de canal
    personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Ancien** : `api.on("deactivate", handler)`.

    **Nouveau** : `api.on("gateway_stop", handler)`. L’événement et le contexte sont le
    même contrat de nettoyage à l’arrêt; seul le nom du hook change.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` reste câblé comme alias de compatibilité obsolète jusqu’après le
    2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → liaison de fil par le noyau">
    **Ancien** : `api.on("subagent_spawning", handler)` renvoyant
    `threadBindingReady` ou `deliveryOrigin`.

    **Nouveau** : laissez le noyau préparer les liaisons de sous-agent `thread: true`
    via l’adaptateur de liaison de session de canal. Utilisez
    `api.on("subagent_spawned", handler)` uniquement pour l’observation après lancement.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` et
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` ne restent que comme
    surfaces de compatibilité obsolètes pendant la migration des plugins externes.

  </Accordion>

  <Accordion title="types de découverte de fournisseurs → types de catalogue de fournisseurs">
    Quatre alias de type de découverte sont désormais de fines enveloppes autour des
    types de l’ère catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus l’ancien sac statique `ProviderCapabilities` - les plugins de fournisseur
    doivent utiliser des hooks de fournisseur explicites comme `buildReplayPolicy`,
    `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et une
    liste classée de niveaux. OpenClaw rétrograde automatiquement les anciennes valeurs
    stockées selon le rang du profil.

    Le contexte inclut `provider`, `modelId`, un `reasoning` fusionné facultatif et
    des faits `compat` de modèle fusionnés facultatifs. Les plugins de fournisseur
    peuvent utiliser ces faits de catalogue pour exposer un profil propre au modèle
    uniquement lorsque le contrat de requête configuré le prend en charge.

    Implémentez un seul hook au lieu de trois. Les anciens hooks continuent de fonctionner
    pendant la fenêtre de dépréciation, mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="fournisseurs d’authentification externes → contracts.externalAuthProviders">
    **Ancien** : implémenter des hooks d’authentification externe sans déclarer le
    fournisseur dans le manifeste du plugin.

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

  <Accordion title="recherche de variables d’environnement de fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : répliquez la même recherche de variables d’environnement dans
    `setup.providers[].envVars` sur le manifeste. Cela consolide les métadonnées
    d’environnement de configuration/statut en un seul endroit et évite de démarrer
    l’environnement d’exécution du plugin uniquement pour répondre aux recherches de
    variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="enregistrement de plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API d’état mémoire -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les helpers additifs d’invite
    et de corpus (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    ne sont pas affectés.

  </Accordion>

  <Accordion title="API de fournisseur d’embeddings mémoire">
    **Ancien** : `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nouveau** : `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Le contrat générique de fournisseur d’embeddings est réutilisable hors de la mémoire
    et constitue le chemin pris en charge pour les nouveaux fournisseurs. L’API
    d’enregistrement propre à la mémoire reste câblée comme compatibilité obsolète
    pendant la migration des fournisseurs existants. L’inspection des plugins signale
    l’usage non groupé comme dette de compatibilité.

  </Accordion>

  <Accordion title="types de messages de session de sous-agent renommés">
    Deux anciens alias de type sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                        | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode d’exécution `readSession` est obsolète au profit de
    `getSessionMessages`. Même signature; l’ancienne méthode délègue à la nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur TaskFlow actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’environnement d’exécution de
    mutation TaskFlow géré pour les plugins qui créent, mettent à jour, annulent ou
    exécutent des tâches enfants depuis un flux. Utilisez `runtime.tasks.flows` lorsque
    le plugin n’a besoin que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="fabriques d’extensions intégrées → middleware de résultat d’outil d’agent">
    Couvert dans « Comment migrer → Migrer les extensions intégrées de résultat d’outil
    vers un middleware » ci-dessus. Inclus ici par souci d’exhaustivité : le chemin
    supprimé réservé à l’exécuteur intégré `api.registerEmbeddedExtensionFactory(...)`
    est remplacé par `api.registerAgentToolResultMiddleware(...)` avec une liste
    d’environnements d’exécution explicite dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
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
Les dépréciations au niveau des extensions (dans les plugins de canal/fournisseur groupés sous
`extensions/`) sont suivies dans leurs propres barrels `api.ts` et `runtime-api.ts`.
Elles n’affectent pas les contrats de plugins tiers et ne sont pas listées ici.
Si vous consommez directement le barrel local d’un plugin groupé, lisez les
commentaires de dépréciation dans ce barrel avant la mise à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution      |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une solution de contournement temporaire, pas d’une solution permanente.

## Associé

- [Démarrage](/fr/plugins/building-plugins) - créer votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - création de plugins de canal
- [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins) - création de plugins fournisseurs
- [Internes des plugins](/fr/plugins/architecture) - exploration détaillée de l’architecture
- [Manifeste du plugin](/fr/plugins/manifest) - référence du schéma de manifeste
