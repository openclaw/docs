---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un plugin vers l’architecture moderne des plugins
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK de Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-07-01T12:59:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture
moderne de Plugins avec des imports ciblés et documentés. Si votre Plugin a été
créé avant la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugins fournissait deux surfaces très ouvertes qui
permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un
point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** - un import unique qui réexportait des dizaines
  d’assistants. Il a été introduit pour maintenir le fonctionnement des anciens
  Plugins basés sur des hooks pendant la construction de la nouvelle architecture
  de Plugins.
- **`openclaw/plugin-sdk/infra-runtime`** - un large barrel d’assistants runtime
  qui mélangeait événements système, état de Heartbeat, files de livraison,
  assistants fetch/proxy, assistants de fichiers, types d’approbation et
  utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large barrel de compatibilité de
  configuration qui conserve encore des assistants directs de chargement/écriture
  obsolètes pendant la fenêtre de migration.
- **`openclaw/extension-api`** - un pont qui donnait aux Plugins un accès direct
  aux assistants côté hôte comme le runner d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension groupée
  uniquement pour runner intégré, désormais supprimé, qui pouvait observer les
  événements du runner intégré comme `tool_result`.

Les larges surfaces d’import sont maintenant **obsolètes**. Elles fonctionnent
encore au runtime, mais les nouveaux Plugins ne doivent pas les utiliser, et les
Plugins existants doivent migrer avant leur suppression dans la prochaine version
majeure. L’API d’enregistrement de factory d’extension uniquement pour runner
intégré a été supprimée ; utilisez plutôt le middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans
le même changement qui introduit un remplacement. Les changements de contrat
cassants doivent d’abord passer par un adaptateur de compatibilité, des
diagnostics, de la documentation et une fenêtre de dépréciation. Cela s’applique
aux imports du SDK, aux champs de manifeste, aux API de configuration, aux hooks
et au comportement d’enregistrement runtime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces casseront quand cela se
  produira. Les anciens enregistrements de factory d’extension intégrée ne se
  chargent déjà plus.
</Warning>

## Pourquoi ce changement

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer un assistant chargeait des dizaines de modules
  sans rapport
- **Dépendances circulaires** - les larges réexports facilitaient la création de
  cycles d’import
- **Surface d’API floue** - aucun moyen de savoir quels exports étaient stables
  ou internes

Le SDK de Plugin moderne corrige cela : chaque chemin d’import
(`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome avec un objectif
clair et un contrat documenté.

Les surfaces de commodité des anciens fournisseurs pour les canaux groupés ont
également disparu. Les surfaces d’assistants marquées par canal étaient des
raccourcis privés du mono-repo, pas des contrats de Plugin stables. Utilisez
plutôt des sous-chemins génériques et étroits du SDK. Dans l’espace de travail
des Plugins groupés, conservez les assistants détenus par le fournisseur dans le
propre `api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs groupés :

- Anthropic conserve les assistants de flux spécifiques à Claude dans sa propre
  surface `api.ts` / `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les assistants de modèle par
  défaut et les builders de fournisseur realtime dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les assistants
  d’onboarding/configuration dans son propre `api.ts`

## Plan de migration de Talk et de la voix realtime

Le code Talk pour la voix realtime, la téléphonie, les réunions et le navigateur
passe d’une comptabilité des tours locale à la surface à un contrôleur de session
Talk partagé exporté par `openclaw/plugin-sdk/realtime-voice`. Le nouveau
contrôleur possède l’enveloppe commune des événements Talk, l’état du tour actif,
l’état de capture, l’état de l’audio de sortie, l’historique récent des
événements et le rejet des tours obsolètes. Les Plugins de fournisseur doivent
continuer à posséder les sessions realtime propres au fournisseur ; les Plugins
de surface doivent continuer à posséder les particularités de capture, de
lecture, de téléphonie et de réunion.

Cette migration Talk est volontairement nette et cassante :

1. Conserver les primitives partagées de contrôleur/runtime dans
   `plugin-sdk/realtime-voice`.
2. Déplacer les surfaces groupées vers le contrôleur partagé : relais navigateur,
   transfert de salle gérée, realtime d’appel vocal, STT en streaming d’appel
   vocal, realtime Google Meet et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*` et
   `talk.client.*`.
4. Annoncer un canal d’événements Talk live unique dans
   `hello-ok.features.events` du Gateway : `talk.event`.
5. Supprimer l’ancien endpoint HTTP realtime et tout chemin de substitution
   d’instructions au moment de la requête.

Le nouveau code ne doit pas appeler `createTalkEventSequencer(...)` directement,
sauf s’il implémente un adaptateur bas niveau ou une fixture de test. Préférez le
contrôleur partagé afin que les événements liés à un tour ne puissent pas être
émis sans identifiant de tour, que les appels `turnEnd` / `turnCancel` obsolètes
ne puissent pas effacer un tour actif plus récent, et que les événements du
cycle de vie de l’audio de sortie restent cohérents entre téléphonie, réunions,
relais navigateur, transfert de salle gérée et clients Talk natifs.

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
`talk.client.create`, car le navigateur possède la négociation fournisseur et le
transport média tandis que le Gateway possède les identifiants, les instructions
et la politique d’outils. `talk.session.*` est la surface commune gérée par le
Gateway pour les sessions realtime gateway-relay, la transcription
gateway-relay et les sessions STT/TTS natives de salle gérée.

Les anciennes configurations qui plaçaient les sélecteurs realtime à côté de
`talk.provider` / `talk.providers` doivent être réparées avec
`openclaw doctor --fix` ; le Talk runtime ne réinterprète pas la configuration
du fournisseur speech/TTS comme configuration du fournisseur realtime.

Les combinaisons `talk.session.create` prises en charge sont volontairement
limitées :

| Mode            | Transport       | Cerveau         | Propriétaire       | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio fournisseur full-duplex relayé via le Gateway ; les appels d’outils sont routés via l’outil agent-consult.   |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription. |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de style push-to-talk et talkie-walkie où le client possède capture/lecture et le Gateway possède l’état du tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode salle réservé aux administrateurs pour les surfaces first-party de confiance qui exécutent directement les actions d’outils du Gateway. |

Correspondance des méthodes supprimées :

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

  | Méthode                        | S’applique à                                            | Contrat                                                                                                                                                                                                          |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajoute un fragment audio PCM en base64 à la session fournisseur détenue par la même connexion Gateway.                                                                                                           |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarre un tour utilisateur de salle gérée.                                                                                                                                                                      |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termine le tour actif après validation du tour obsolète.                                                                                                                                                         |
  | `talk.session.cancelTurn`       | toutes les sessions détenues par Gateway                | Annule le travail actif de capture/fournisseur/agent/TTS pour un tour.                                                                                                                                           |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrête la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                                           |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Termine un appel d’outil fournisseur émis par le relais ; passez `options.willContinue` pour une sortie intermédiaire ou `options.suppressResponse` pour satisfaire l’appel sans autre réponse de l’assistant. |
  | `talk.session.steer`            | sessions Talk adossées à un agent                       | Envoie un contrôle vocal `status`, `steer`, `cancel` ou `followup` à l’exécution intégrée active résolue depuis la session Talk.                                                                                  |
  | `talk.session.close`            | toutes les sessions unifiées                            | Arrête les sessions de relais ou révoque l’état de salle gérée, puis oublie l’identifiant de session unifiée.                                                                                                    |

  N’introduisez pas de cas particuliers de fournisseur ou de plateforme dans le cœur pour que cela fonctionne.
  Le cœur possède la sémantique des sessions Talk. Les plugins fournisseurs possèdent la configuration des sessions de fournisseur.
  Les appels vocaux et Google Meet possèdent les adaptateurs de téléphonie/réunion. Le navigateur et les applications natives
  possèdent l’UX de capture/lecture des appareils.

  ## Politique de compatibilité

  Pour les plugins externes, le travail de compatibilité suit cet ordre :

  1. ajouter le nouveau contrat
  2. conserver l’ancien comportement câblé via un adaptateur de compatibilité
  3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
  4. couvrir les deux chemins dans les tests
  5. documenter l’obsolescence et le chemin de migration
  6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour
  des décomptes compacts, `--owner <id>` pour un plugin ou propriétaire de compatibilité, et
  `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des
  enregistrements de compatibilité échus, des imports SDK réservés inter-propriétaires ou des sous-chemins SDK
  réservés inutilisés. Le rapport groupe les enregistrements de
  compatibilité obsolètes par date de suppression, compte les références locales dans le code/la documentation,
  fait ressortir les imports SDK réservés inter-propriétaires et résume le pont SDK privé
  memory-host afin que le nettoyage de compatibilité reste explicite au lieu de
  s’appuyer sur des recherches ad hoc. Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ;
  les exports d’assistants réservés inutilisés doivent être supprimés du SDK public.

  Si un champ de manifeste est toujours accepté, les auteurs de plugins peuvent continuer à l’utiliser jusqu’à ce que
  la documentation et les diagnostics indiquent le contraire. Le nouveau code doit privilégier le remplacement documenté,
  mais les plugins existants ne doivent pas casser pendant des versions mineures ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Les plugins groupés doivent cesser d’appeler directement
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)`. Préférez la configuration qui a
    déjà été transmise dans le chemin d’appel actif. Les gestionnaires longue durée qui ont besoin de
    l’instantané du processus actuel peuvent utiliser `api.runtime.config.current()`. Les outils
    d’agent longue durée doivent utiliser `ctx.getRuntimeConfig()` du contexte d’outil dans
    `execute` afin qu’un outil créé avant une écriture de configuration voie toujours la configuration
    runtime actualisée.

    Les écritures de configuration doivent passer par les assistants transactionnels et choisir une
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
    `loadConfig` et `writeConfigFile` restent des assistants de compatibilité obsolètes
    pour les plugins externes pendant la fenêtre de migration et avertissent une seule fois avec
    le code de compatibilité `runtime-config-load-write`. Les plugins groupés et le code runtime
    du dépôt sont protégés par des garde-fous de scanner dans
    `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation de plugin en production
    échoue immédiatement, les écritures directes de configuration échouent, les méthodes du serveur Gateway doivent utiliser
    l’instantané runtime de la requête, les assistants runtime d’envoi/action/client de canal
    doivent recevoir la configuration depuis leur frontière, et les modules runtime longue durée n’ont
    aucun appel ambiant autorisé à `loadConfig()`.

    Le nouveau code de plugin doit également éviter d’importer le large barrel de compatibilité
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit
    qui correspond à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration comme `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané runtime actuel | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Assistants de magasin de session | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Assistants runtime de politique de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution d’entrée secrète | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les plugins groupés et leurs tests sont protégés par scanner contre le large
    barrel afin que les imports et les mocks restent locaux au comportement dont ils ont besoin. Le large
    barrel existe toujours pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Les plugins groupés doivent remplacer les gestionnaires de résultats d’outils
    `api.registerEmbeddedExtensionFactory(...)` réservés à l’exécuteur intégré par un
    middleware neutre vis-à-vis du runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
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

    Les plugins installés peuvent également enregistrer un middleware de résultat d’outil lorsqu’ils sont
    explicitement activés et déclarent chaque runtime ciblé dans
    `contracts.agentToolResultMiddleware`. Les enregistrements de middleware installé non déclarés
    sont rejetés.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Les plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre runtime-context partagé.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets runtime possédés par le canal, comme les clients, tokens ou applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage possédés par le plugin depuis les gestionnaires d’approbation natifs ;
      le cœur possède désormais les avis de routage ailleurs issus des résultats de livraison réels
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la disposition actuelle des capacités d’approbation.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais fermés sauf si vous passez explicitement
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
    Recherchez dans votre plugin les imports provenant de l’une ou l’autre surface obsolète :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
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

    Pour les assistants côté hôte, utilisez le runtime de plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers de pont hérités :

    | Ancienne importation | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de stockage de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface de helpers ciblée dont
    il a réellement besoin :

    | Besoin | Importation |
    | --- | --- |
    | Helpers de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers de réveil, d’événement et de visibilité Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file des livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité du canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers sécurisés de chemins de fichiers locaux/médias | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch tenant compte du dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique du dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers de charge utile de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers de formatage d’erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins intégrés sont protégés par scanner contre `infra-runtime`, donc
    le code du dépôt ne peut pas régresser vers le large barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Le nouveau code de routage de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms route-key et comparable-target restent disponibles comme alias
    de compatibilité pendant la fenêtre de migration, mais les nouveaux plugins
    doivent utiliser les noms de route qui décrivent directement le comportement :

    | Ancien helper | Helper moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les helpers de route modernes normalisent `{ channel, to, accountId, threadId }`
    de manière cohérente entre les approbations natives, la suppression des réponses,
    la déduplication entrante, la livraison cron et le routage de session.

    N’ajoutez pas de nouvelles utilisations de `ChannelMessagingAdapter.parseExplicitTarget` ni
    des helpers de route chargée adossés au parseur (`parseExplicitTargetForLoadedChannel`
    ou `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` depuis `plugin-sdk/channel-route`.
    Ces hooks sont obsolètes et ne restent disponibles que pour les anciens plugins pendant la
    fenêtre de migration. Les nouveaux plugins de canal doivent utiliser
    `messaging.targetResolver.resolveTarget(...)` pour la normalisation des identifiants de cible
    et le fallback en cas d’absence dans le répertoire, `messaging.inferTargetChatType(...)` lorsque le cœur
    a besoin d’un type de pair précoce, et `messaging.resolveOutboundSessionRoute(...)`
    pour l’identité de session et de fil native au fournisseur.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Tableau des chemins d’importation courants">
  | Chemin d’importation | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Aide canonique d’entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport ombrelle hérité pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Aide d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Aides partagées de l’assistant de configuration | Traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Aides d’exécution pendant la configuration | `createSetupTranslator`, adaptateurs de correctifs de configuration sûrs à l’importation, aides de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsolète de l’adaptateur de configuration | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Aides d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Aides multicomptes | Aides de liste/configuration/porte d’action de comptes |
  | `plugin-sdk/account-id` | Aides d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Aides de recherche de compte | Aides de recherche de compte et de repli par défaut |
  | `plugin-sdk/account-helpers` | Aides de compte ciblées | Aides de liste de comptes/d’action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse, saisie et câblage de livraison de source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et aides d’accès DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux plugins doivent définir des schémas locaux au plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Aides de configuration de commandes Telegram | Normalisation des noms de commande, rognage des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Aides d’enveloppe entrante | Aides partagées de route et de génération d’enveloppe |
  | `plugin-sdk/channel-inbound` | Aides de réception entrante | Construction de contexte, formatage, racines, exécuteurs, distribution de réponses préparées et prédicats de distribution |
  | `plugin-sdk/messaging-targets` | Chemin d’importation obsolète d’analyse de cibles | Utilisez `plugin-sdk/channel-targets` pour les aides génériques d’analyse de cibles, `plugin-sdk/channel-route` pour la comparaison de routes et `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` appartenant au plugin pour la résolution de cibles propre au fournisseur |
  | `plugin-sdk/outbound-media` | Aides de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Aides de cycle de vie des messages sortants | Adaptateurs de messages, accusés de réception, aides d’envoi durable, aides d’aperçu/de streaming en direct, options de réponse, aides de cycle de vie, identité sortante et planification de payload |
  | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Aides de liaison de fils | Cycle de vie des liaisons de fils et aides d’adaptateurs |
  | `plugin-sdk/agent-media-payload` | Aides héritées de payload média | Générateur de payload média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Couche de compatibilité obsolète | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Aides d’exécution larges | Aides d’exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Aides ciblées d’environnement d’exécution | Aides de journalisation/environnement d’exécution, délai d’expiration, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Aides partagées d’exécution de plugin | Aides de commandes/hooks/http/interactives de plugin |
  | `plugin-sdk/hook-runtime` | Aides de pipeline de hooks | Aides partagées de pipeline de hooks webhook/internes |
  | `plugin-sdk/lazy-runtime` | Aides d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Aides de processus | Aides partagées d’exécution de commandes |
  | `plugin-sdk/cli-runtime` | Aides d’exécution CLI | Formatage de commandes, attentes, aides de version |
  | `plugin-sdk/gateway-runtime` | Aides Gateway | Client Gateway, aide de démarrage prête pour la boucle d’événements, résolution de l’hôte LAN annoncé et aides de correctifs d’état de canal |
  | `plugin-sdk/config-runtime` | Couche de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Aides de commandes Telegram | Aides de validation de commandes Telegram stables au repli lorsque la surface de contrat Telegram groupée est indisponible |
  | `plugin-sdk/approval-runtime` | Aides d’invites d’approbation | Payload d’approbation exec/plugin, aides de capacité/profil d’approbation, aides de routage/exécution d’approbation native et formatage structuré du chemin d’affichage d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Aides d’authentification d’approbation | Résolution d’approbateur, authentification d’action dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Aides de client d’approbation | Aides natives de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Aides de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Aides de Gateway d’approbation | Aide partagée de résolution de Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Aides d’adaptateur d’approbation | Aides légères de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Aides de gestionnaire d’approbation | Aides d’exécution de gestionnaire d’approbation plus larges ; préférez les jonctions d’adaptateur/Gateway plus ciblées lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Aides de cible d’approbation | Aides de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Aides de réponse d’approbation | Aides de payload de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Aides de contexte d’exécution de canal | Aides génériques d’enregistrement/obtention/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Aides de sécurité | Aides partagées de confiance, filtrage DM, fichiers/chemins bornés par la racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Aides de politique SSRF | Aides de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Aides d’exécution SSRF | Dispatcher épinglé, fetch protégé, aides de politique SSRF |
  | `plugin-sdk/system-event-runtime` | Aides d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Aides Heartbeat | Aides de réveil, d’événement et de visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Aides de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Aides d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Aides de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Aides d’accès aux fichiers | Aides de chemins sûrs de fichiers/médias locaux |
  | `plugin-sdk/transport-ready-runtime` | Aides de disponibilité du transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Aides de politique d’approbation exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Aides de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Aides de filtrage de diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Aides de formatage d’erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, aides de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Aides fetch/proxy enveloppées | `resolveFetch`, aides de proxy, aides d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Aides de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Aides de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politiques |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation et mappage d’entrées | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage de commandes et aides de surface de commandes | `resolveControlCommandGate`, aides d’autorisation d’expéditeur, aides de registre de commandes incluant le formatage dynamique du menu d’arguments |
  | `plugin-sdk/command-status` | Générateurs d’état/aide de commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse d’entrée secrète | Aides d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Aides de requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Aides de garde de corps Webhook | Aides de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Distribution entrante, heartbeat, planificateur de réponses, découpage en morceaux |
  | `plugin-sdk/reply-dispatch-runtime` | Aides ciblées de distribution des réponses | Finalisation, distribution au fournisseur et aides d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Aides d’historique de réponses | `createChannelHistoryWindow` ; exports obsolètes de compatibilité d’aides de mappage tels que `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Aides de découpage des réponses | Aides de découpage de texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Aides de magasin de sessions | Chemin du magasin et aides updated-at |
  | `plugin-sdk/state-paths` | Aides de chemins d’état | Aides de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Utilitaires de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilitaires de normalisation des clés de session |
  | `plugin-sdk/status-helpers` | Utilitaires d’état de canal | Générateurs de résumés d’état de canal/compte, valeurs par défaut d’état d’exécution, utilitaires de métadonnées d’incident |
  | `plugin-sdk/target-resolver-runtime` | Utilitaires de résolution de cible | Utilitaires partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation de chaînes | Utilitaires de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Utilitaires d’URL de requête | Extraire les URL sous forme de chaînes depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Utilitaires de commandes chronométrées | Exécuteur de commandes chronométrées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres courants pour outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire les charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Utilitaires de chemins temporaires | Utilitaires partagés de chemins de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Utilitaires de journalisation | Journaliseur de sous-système et utilitaires de masquage |
  | `plugin-sdk/markdown-table-runtime` | Utilitaires de tableaux Markdown | Utilitaires de mode de tableaux Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Utilitaires sélectionnés de configuration de fournisseurs locaux/auto-hébergés | Utilitaires de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Utilitaires ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI | Mêmes utilitaires de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Utilitaires d’authentification d’exécution des fournisseurs | Utilitaires de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Utilitaires de configuration de clés API des fournisseurs | Utilitaires d’intégration/écriture de profil pour clé API |
  | `plugin-sdk/provider-auth-result` | Utilitaires de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Utilitaires de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Utilitaires de variables d’environnement de fournisseur | Utilitaires de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Utilitaires partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, utilitaires de points de terminaison de fournisseur et utilitaires de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Utilitaires partagés de catalogue de fournisseurs | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Utilitaires de configuration d’intégration |
  | `plugin-sdk/provider-http` | Utilitaires HTTP de fournisseur | Utilitaires génériques de capacités HTTP/point de terminaison de fournisseur, y compris les utilitaires de formulaire multipart de transcription audio |
  | `plugin-sdk/provider-web-fetch` | Utilitaires web-fetch de fournisseur | Utilitaires d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilitaires de configuration de recherche web de fournisseur | Utilitaires restreints de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat de recherche web de fournisseur | Utilitaires restreints de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Utilitaires de recherche web de fournisseur | Utilitaires d’enregistrement/cache/exécution de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Utilitaires de compatibilité d’outils/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage + diagnostics de schémas DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Utilitaires d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres utilitaires d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Utilitaires d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux et utilitaires partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport de fournisseur | Utilitaires de transport natif de fournisseur tels que fetch protégé, extraction de texte de résultat d’outil, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilitaires média partagés | Utilitaires de récupération/transformation/stockage de média, détection des dimensions vidéo basée sur ffprobe et générateurs de charges utiles média |
  | `plugin-sdk/media-generation-runtime` | Utilitaires partagés de génération de média | Utilitaires partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Utilitaires de compréhension média | Types de fournisseurs de compréhension média et exports d’utilitaires image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Export de compatibilité texte large obsolète | Utilisez `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Utilitaires de découpage de texte | Utilitaire de découpage de texte sortant |
  | `plugin-sdk/speech` | Utilitaires vocaux | Types de fournisseurs vocaux ainsi qu’utilitaires de directives, registre et validation destinés aux fournisseurs, et générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Utilitaires de transcription en temps réel | Types de fournisseurs, utilitaires de registre et utilitaire partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Utilitaires vocaux en temps réel | Types de fournisseurs, utilitaires de registre/résolution, utilitaires de session de pont, files partagées de réponse vocale d’agent, contrôle vocal d’exécution active, santé des transcriptions/événements, suppression d’écho, correspondance des questions de consultation, coordination de consultation forcée, suivi du contexte de tour, suivi de l’activité de sortie et utilitaires de consultation rapide du contexte |
  | `plugin-sdk/image-generation` | Utilitaires de génération d’images | Types de fournisseurs de génération d’images, utilitaires d’assets image/URL de données et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et utilitaires de registre |
  | `plugin-sdk/music-generation` | Utilitaires de génération de musique | Types de fournisseurs/requêtes/résultats de génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, utilitaires de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Utilitaires de génération vidéo | Types de fournisseurs/requêtes/résultats de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, utilitaires de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Utilitaires de réponse interactive | Normalisation/réduction des charges utiles de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives restreintes de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Utilitaires d’écriture de configuration de canal | Utilitaires d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports partagés de préambule de Plugin de canal |
  | `plugin-sdk/channel-status` | Utilitaires d’état de canal | Utilitaires partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilitaires de configuration de liste d’autorisation | Utilitaires de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Utilitaires d’accès de groupe | Utilitaires partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes | Utilisez `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Utilitaires de garde de DM direct | Utilitaires restreints de politique de garde pré-crypto |
  | `plugin-sdk/extension-shared` | Utilitaires d’extension partagés | Primitives d’utilitaires de canal passif/état et proxy ambiant |
  | `plugin-sdk/webhook-targets` | Utilitaires de cibles Webhook | Registre de cibles Webhook et utilitaires d’installation de routes |
  | `plugin-sdk/webhook-path` | Alias obsolète de chemin Webhook | Utilisez `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Utilitaires web média partagés | Utilitaires de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport de compatibilité Zod obsolète | Importez `zod` depuis `zod` directement |
  | `plugin-sdk/memory-core` | Utilitaires memory-core groupés | Surface d’utilitaires de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’indexation/recherche de mémoire |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registre d’embeddings mémoire | Utilitaires légers de registre de fournisseurs d’embeddings mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte mémoire | Exports du moteur de fondation de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte mémoire | Contrats d’embeddings mémoire, accès au registre, fournisseur local et utilitaires génériques de lots/distants ; les fournisseurs distants concrets résident dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte mémoire | Exports du moteur QMD de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte mémoire | Exports du moteur de stockage de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Utilitaires multimodaux de l’hôte mémoire | Utilitaires multimodaux de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Utilitaires de requête de l’hôte mémoire | Utilitaires de requête de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Utilitaires de secret de l’hôte mémoire | Utilitaires de secret de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias d’événements mémoire obsolète | Utilisez `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Utilitaires d’état de l’hôte mémoire | Utilitaires d’état de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte mémoire | Utilitaires d’exécution CLI de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution noyau de l’hôte mémoire | Utilitaires d’exécution noyau de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilitaires de fichiers/exécution de l’hôte mémoire | Utilitaires de fichiers/exécution de l’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution noyau de l’hôte mémoire | Alias indépendant du fournisseur pour les utilitaires d’exécution noyau de l’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte mémoire | Alias indépendant du fournisseur pour les utilitaires de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichiers/exécution mémoire obsolète | Utilisez `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Utilitaires Markdown gérés | Utilitaires partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias obsolète d’état de l’hôte mémoire | Utilisez `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Barrel de compatibilité obsolète local au dépôt ; utilisez des sous-chemins de test ciblés locaux au dépôt tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau constitue intentionnellement le sous-ensemble commun de migration, et non toute la
surface du SDK. L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports de package sont générés à partir
du sous-ensemble public.

Les points d’extension auxiliaires réservés aux plugins groupés ont été retirés de la carte
d’export publique du SDK, sauf pour les façades de compatibilité explicitement documentées
comme le shim obsolète `plugin-sdk/discord` conservé pour le package publié
`@openclaw/discord@2026.3.13`. Les helpers propres à un propriétaire vivent dans le
package du plugin propriétaire ; le comportement d’hôte partagé doit passer par des
contrats SDK génériques comme `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
et `plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus étroit qui corresponde à la tâche. Si vous ne trouvez pas d’export,
consultez la source dans `src/plugin-sdk/` ou demandez aux mainteneurs quel contrat générique
doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent au SDK de plugin, au contrat de fournisseur,
à la surface d’exécution et au manifeste. Chacune fonctionne encore aujourd’hui, mais sera
supprimée dans une future version majeure. L’entrée sous chaque élément associe l’ancienne
API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="Générateurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports ; ils sont simplement importés depuis le sous-chemin plus étroit. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers de filtrage des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` ; renvoie un
    seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Shim d’exécution de canal et helpers d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    plugins de canal. Ne l’importez pas depuis du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les helpers `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    dépréciés avec les exports de canal bruts `"actions"`. Exposez les capacités via
    la surface sémantique `presentation` à la place : les plugins de canal déclarent
    ce qu’ils affichent (cartes, boutons, sélecteurs) plutôt que les noms d’actions
    bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Helper tool() du fournisseur de recherche web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin de fournisseur.
    OpenClaw n’a plus besoin du helper SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de prompt
    plate en texte brut à partir des messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs de contexte utilisateur structurés. Les
    plugins de canal attachent les métadonnées de routage (fil, sujet, réponse à, réactions)
    sous forme de champs typés au lieu de les concaténer dans une chaîne de prompt. Le
    helper `formatAgentEnvelope(...)` reste pris en charge pour les enveloppes synthétisées
    destinées à l’assistant, mais les enveloppes entrantes en texte brut sont en cours
    de retrait.

    Zones concernées : `inbound_claim`, `message_received` et tout plugin de canal
    personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Ancien** : `api.on("deactivate", handler)`.

    **Nouveau** : `api.on("gateway_stop", handler)`. L’événement et le contexte relèvent
    du même contrat de nettoyage à l’arrêt ; seul le nom du hook change.

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

    `deactivate` reste câblé comme alias de compatibilité déprécié jusqu’après le
    2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → liaison de fil par le cœur">
    **Ancien** : `api.on("subagent_spawning", handler)` renvoyant
    `threadBindingReady` ou `deliveryOrigin`.

    **Nouveau** : laissez le cœur préparer les liaisons de sous-agent `thread: true` via
    l’adaptateur de liaison de session de canal. Utilisez `api.on("subagent_spawned", handler)`
    uniquement pour l’observation après lancement.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` restent uniquement comme
    surfaces de compatibilité dépréciées pendant la migration des plugins externes.

  </Accordion>

  <Accordion title="Types de découverte de fournisseurs → types de catalogue de fournisseurs">
    Quatre alias de type de découverte sont désormais de fines enveloppes autour des
    types de l’ère catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ainsi que l’ancien sac statique `ProviderCapabilities` : les plugins de fournisseur
    doivent utiliser des hooks de fournisseur explicites comme `buildReplayPolicy`,
    `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="Hooks de stratégie de raisonnement → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un seul `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et
    une liste ordonnée de niveaux. OpenClaw rétrograde automatiquement les anciennes
    valeurs stockées selon le rang du profil.

    Le contexte inclut `provider`, `modelId`, le `reasoning` fusionné facultatif
    et les faits `compat` de modèle fusionnés facultatifs. Les plugins de fournisseur
    peuvent utiliser ces faits de catalogue pour exposer un profil propre à un modèle
    uniquement lorsque le contrat de requête configuré le prend en charge.

    Implémentez un hook au lieu de trois. Les hooks hérités continuent de fonctionner
    pendant la fenêtre de dépréciation, mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="Fournisseurs d’authentification externes → contracts.externalAuthProviders">
    **Ancien** : implémenter des hooks d’authentification externe sans déclarer le fournisseur
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

  <Accordion title="Recherche de variables d’environnement de fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : dupliquez la même recherche de variable d’environnement dans
    `setup.providers[].envVars` sur le manifeste. Cela consolide les métadonnées
    d’environnement de configuration/statut à un seul endroit et évite de démarrer
    l’exécution du plugin uniquement pour répondre aux recherches de variables
    d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fin de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement de plugin de mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés :
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un seul appel sur l’API d’état mémoire :
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les helpers additifs de prompt
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
    d’enregistrement propre à la mémoire reste câblée comme compatibilité dépréciée
    pendant la migration des fournisseurs existants. L’inspection des plugins signale
    l’usage non groupé comme dette de compatibilité.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux alias de type hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                       | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode d’exécution `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur de TaskFlow actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’exécution de mutation TaskFlow
    gérée pour les plugins qui créent, mettent à jour, annulent ou exécutent des tâches
    enfant depuis un flux. Utilisez `runtime.tasks.flows` lorsque le plugin n’a besoin
    que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabriques d’extensions intégrées → middleware de résultats d’outils d’agent">
    Couvert dans « How to migrate → Migrate embedded tool-result extensions to
    middleware » ci-dessus. Inclus ici par souci d’exhaustivité : le chemin
    `api.registerEmbeddedExtensionFactory(...)`, supprimé et réservé à l’ancien exécuteur
    intégré, est remplacé par `api.registerAgentToolResultMiddleware(...)` avec une liste
    d’exécutions explicite dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, réexporté depuis `openclaw/plugin-sdk`, est désormais un
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
Elles n’affectent pas les contrats des plugins tiers et ne sont pas listées ici.
Si vous consommez directement le barrel local d’un plugin groupé, lisez les commentaires
de dépréciation dans ce barrel avant la mise à niveau.
</Note>

## Calendrier de suppression

| Quand                         | Ce qui se passe                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Maintenant**                | Les surfaces obsolètes émettent des avertissements d’exécution                  |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Connexe

- [Bien démarrer](/fr/plugins/building-plugins) - créer votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports de sous-chemins
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - créer des plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - créer des plugins de fournisseur
- [Internes des plugins](/fr/plugins/architecture) - analyse approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) - référence du schéma de manifeste
