---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous avez utilisé api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture moderne des Plugins
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK de Plugin moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:02:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de compatibilité descendante à une architecture de Plugin moderne avec des importations ciblées et documentées. Si votre Plugin a été créé avant la nouvelle architecture, ce guide vous aide à le migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** - une importation unique qui réexportait des dizaines d’assistants. Elle a été introduite pour maintenir le fonctionnement des anciens Plugins basés sur des hooks pendant la construction de la nouvelle architecture de Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un large module-barillet d’assistants runtime qui mélangeait événements système, état Heartbeat, files de livraison, assistants fetch/proxy, assistants de fichiers, types d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large module-barillet de compatibilité de configuration qui conserve encore des assistants directs de chargement/écriture obsolètes pendant la fenêtre de migration.
- **`openclaw/extension-api`** - une passerelle qui donnait aux Plugins un accès direct aux assistants côté hôte, comme l’exécuteur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension intégré uniquement pour l’exécuteur intégré, désormais supprimé, qui pouvait observer les événements de l’exécuteur intégré tels que `tool_result`.

Les larges surfaces d’importation sont désormais **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants devraient migrer avant que la prochaine version majeure ne les supprime. L’API d’enregistrement de factory d’extension réservée à l’exécuteur intégré a été supprimée ; utilisez plutôt le middleware de résultats d’outil.

OpenClaw ne supprime ni ne réinterprète le comportement documenté des Plugins dans le même changement qui introduit un remplacement. Les changements de contrat incompatibles doivent d’abord passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation. Cela s’applique aux importations SDK, aux champs de manifeste, aux API de configuration, aux hooks et au comportement d’enregistrement runtime.

<Warning>
  La couche de compatibilité descendante sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner lorsque cela arrivera.
  Les anciens enregistrements de factory d’extension intégrée ne se chargent déjà plus.
</Warning>

## Pourquoi ce changement

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer un assistant chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** - les réexportations larges facilitaient la création de cycles d’importation
- **Surface d’API peu claire** - aucun moyen de savoir quelles exportations étaient stables ou internes

Le SDK de Plugin moderne corrige cela : chaque chemin d’importation (`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome, avec un objectif clair et un contrat documenté.

Les points de commodité hérités pour fournisseurs dans les canaux intégrés ont également disparu. Les points d’assistance marqués par canal étaient des raccourcis privés de mono-dépôt, pas des contrats de Plugin stables. Utilisez plutôt des sous-chemins SDK génériques et étroits. Dans l’espace de travail des Plugins intégrés, gardez les assistants appartenant au fournisseur dans le `api.ts` ou `runtime-api.ts` propre à ce Plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les assistants de flux propres à Claude dans son propre point `api.ts` / `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseurs, les assistants de modèle par défaut et les constructeurs de fournisseurs temps réel dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les assistants d’onboarding/configuration dans son propre `api.ts`

## Plan de migration Talk et voix temps réel

Le code de voix temps réel, téléphonie, réunion et Talk navigateur passe d’une comptabilité de tours locale à la surface à un contrôleur de session Talk partagé exporté par `openclaw/plugin-sdk/realtime-voice`. Le nouveau contrôleur possède l’enveloppe commune des événements Talk, l’état du tour actif, l’état de capture, l’état de sortie audio, l’historique récent des événements et le rejet des tours obsolètes. Les Plugins fournisseurs doivent continuer à posséder les sessions temps réel propres au fournisseur ; les Plugins de surface doivent continuer à posséder la capture, la lecture, la téléphonie et les particularités de réunion.

Cette migration Talk est intentionnellement une rupture nette :

1. Conserver les primitives partagées de contrôleur/runtime dans
   `plugin-sdk/realtime-voice`.
2. Migrer les surfaces intégrées vers le contrôleur partagé : relais navigateur,
   transfert de salle gérée, temps réel d’appel vocal, STT en streaming d’appel vocal, temps réel Google
   Meet et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*` et
   `talk.client.*`.
4. Annoncer un canal d’événements Talk actif dans Gateway
   `hello-ok.features.events` : `talk.event`.
5. Supprimer l’ancien endpoint HTTP temps réel et tout chemin de surcharge d’instructions au moment de la requête.

Le nouveau code ne devrait pas appeler directement `createTalkEventSequencer(...)`, sauf s’il implémente un adaptateur bas niveau ou une fixture de test. Préférez le contrôleur partagé afin que les événements limités à un tour ne puissent pas être émis sans identifiant de tour, que les appels `turnEnd` /
`turnCancel` obsolètes ne puissent pas effacer un tour actif plus récent, et que les événements de cycle de vie de sortie audio restent cohérents entre téléphonie, réunions, relais navigateur, transfert de salle gérée et clients Talk natifs.

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

Les sessions WebRTC/websocket fournisseur appartenant au navigateur utilisent `talk.client.create`, car le navigateur possède la négociation fournisseur et le transport média tandis que le Gateway possède les identifiants, les instructions et la politique d’outils. `talk.session.*` est la surface commune gérée par Gateway pour les sessions temps réel gateway-relay, la transcription gateway-relay et les sessions STT/TTS natives de salle gérée.

Les anciennes configurations qui plaçaient les sélecteurs temps réel à côté de `talk.provider` /
`talk.providers` doivent être réparées avec `openclaw doctor --fix` ; Talk runtime ne réinterprète pas la configuration du fournisseur speech/TTS comme configuration de fournisseur temps réel.

Les combinaisons prises en charge par `talk.session.create` sont volontairement limitées :

| Mode            | Transport       | Brain           | Propriétaire       | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio fournisseur full-duplex relayé via le Gateway ; les appels d’outils sont routés via l’outil agent-consult.  |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription. |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de type push-to-talk et talkie-walkie où le client possède capture/lecture et le Gateway possède l’état des tours. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode de salle réservé aux administrateurs pour les surfaces first-party fiables qui exécutent directement les actions d’outils Gateway. |

Carte des méthodes supprimées :

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

Le vocabulaire de contrôle unifié est également volontairement étroit :

  | Méthode                        | S’applique à                                            | Contrat                                                                                                                                                                                  |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajoute un fragment audio PCM en base64 à la session du fournisseur détenue par la même connexion Gateway.                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarre un tour utilisateur en salle gérée.                                                                                                                                              |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termine le tour actif après validation du tour obsolète.                                                                                                                                 |
  | `talk.session.cancelTurn`       | toutes les sessions détenues par Gateway                | Annule le travail actif de capture, de fournisseur, d’agent et de TTS pour un tour.                                                                                                      |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrête la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Termine un appel d’outil fournisseur émis par le relais ; passez `options.willContinue` pour une sortie intermédiaire ou `options.suppressResponse` pour satisfaire l’appel sans autre réponse de l’assistant. |
  | `talk.session.steer`            | sessions Talk appuyées par un agent                     | Envoie un contrôle vocal `status`, `steer`, `cancel` ou `followup` à l’exécution intégrée active résolue à partir de la session Talk.                                                   |
  | `talk.session.close`            | toutes les sessions unifiées                            | Arrête les sessions de relais ou révoque l’état de salle gérée, puis oublie l’identifiant de session unifiée.                                                                            |

  N’introduisez pas de cas particuliers liés à un fournisseur ou à une plateforme dans le cœur pour que cela fonctionne.
  Le cœur possède la sémantique des sessions Talk. Les Plugins fournisseurs possèdent la configuration des sessions vendeur.
  Les appels vocaux et Google Meet possèdent les adaptateurs de téléphonie/réunion. Les navigateurs et les applications natives
  possèdent l’UX de capture/lecture des appareils.

  ## Politique de compatibilité

  Pour les Plugins externes, le travail de compatibilité suit cet ordre :

  1. ajouter le nouveau contrat
  2. conserver l’ancien comportement câblé via un adaptateur de compatibilité
  3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
  4. couvrir les deux chemins dans les tests
  5. documenter l’obsolescence et le chemin de migration
  6. supprimer seulement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour
  des comptages compacts, `--owner <id>` pour un Plugin ou un propriétaire de compatibilité, et
  `pnpm plugins:boundary-report:ci` lorsqu’une porte CI doit échouer sur des enregistrements
  de compatibilité arrivés à échéance, des imports SDK réservés entre propriétaires, ou des sous-chemins SDK réservés
  inutilisés. Le rapport regroupe les enregistrements de compatibilité obsolètes
  par date de suppression, compte les références locales dans le code et la documentation,
  met en évidence les imports SDK réservés entre propriétaires, et résume le pont SDK privé
  memory-host afin que le nettoyage de compatibilité reste explicite au lieu de
  reposer sur des recherches ad hoc. Les sous-chemins SDK réservés doivent avoir un usage propriétaire suivi ;
  les exports d’assistants réservés inutilisés doivent être supprimés du SDK public.

  Si un champ de manifeste est encore accepté, les auteurs de Plugins peuvent continuer à l’utiliser jusqu’à ce que
  la documentation et les diagnostics indiquent le contraire. Le nouveau code devrait privilégier le remplacement documenté,
  mais les Plugins existants ne devraient pas casser pendant les versions mineures ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Les Plugins groupés doivent cesser d’appeler
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)` directement. Préférez la configuration qui a
    déjà été transmise au chemin d’appel actif. Les gestionnaires de longue durée qui ont besoin de
    l’instantané du processus courant peuvent utiliser `api.runtime.config.current()`. Les outils
    d’agent de longue durée doivent utiliser `ctx.getRuntimeConfig()` du contexte d’outil à l’intérieur de
    `execute` afin qu’un outil créé avant une écriture de configuration voie toujours la configuration
    d’exécution actualisée.

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
    que la modification nécessite un redémarrage propre du gateway, et
    `afterWrite: { mode: "none", reason: "..." }` seulement lorsque l’appelant possède le
    suivi et veut délibérément supprimer le planificateur de rechargement.
    Les résultats de mutation incluent un résumé typé `followUp` pour les tests et la journalisation ;
    le gateway reste responsable de l’application ou de la planification du redémarrage.
    `loadConfig` et `writeConfigFile` restent des assistants de compatibilité obsolètes
    pour les Plugins externes pendant la fenêtre de migration et avertissent une fois avec
    le code de compatibilité `runtime-config-load-write`. Les Plugins groupés et le code
    d’exécution du dépôt sont protégés par les garde-fous du scanner dans
    `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : la nouvelle utilisation de Plugin en production
    échoue immédiatement, les écritures directes de configuration échouent, les méthodes du serveur gateway doivent utiliser
    l’instantané d’exécution de la requête, les assistants d’envoi/action/client de canal d’exécution
    doivent recevoir la configuration depuis leur frontière, et les modules d’exécution de longue durée ont
    zéro appel ambiant `loadConfig()` autorisé.

    Le nouveau code de Plugin doit également éviter d’importer le large barrel de compatibilité
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit
    qui correspond à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration tels que `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané d’exécution courant | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Assistants de magasin de sessions | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Assistants d’exécution de stratégie de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution d’entrée secrète | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les Plugins groupés et leurs tests sont protégés par scanner contre le large
    barrel afin que les imports et les mocks restent locaux au comportement dont ils ont besoin. Le large
    barrel existe toujours pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Les Plugins groupés doivent remplacer les gestionnaires de résultats d’outils
    `api.registerEmbeddedExtensionFactory(...)` réservés à l’exécuteur intégré par un middleware
    neutre vis-à-vis de l’exécution.

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
    explicitement activés et déclarent chaque exécution ciblée dans
    `contracts.agentToolResultMiddleware`. Les enregistrements de middleware installés non déclarés
    sont rejetés.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Les Plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte d’exécution.

    Principaux changements :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres à l’approbation hors du câblage hérité `plugin.auth` /
      `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de Plugin de canal ;
      déplacez les champs de livraison/natifs/rendu vers `approvalCapability`
    - `plugin.auth` reste uniquement pour les flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets d’exécution détenus par le canal, tels que les clients, les jetons ou les applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage détenus par le Plugin depuis les gestionnaires d’approbation natifs ;
      le cœur possède désormais les avis de routage ailleurs à partir des résultats de livraison réels
    - Lorsque vous passez `channelRuntime` dans `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

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

    Si votre appelant ne dépend pas intentionnellement du repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Find deprecated imports">
    Recherchez dans votre Plugin les imports provenant de l’une ou l’autre surface obsolète :

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

    Pour les assistants côté hôte, utilisez l’exécution de Plugin injectée au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres fonctions d’aide de pont héritées :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | fonctions d’aide du magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface d’aide ciblée dont il
    a réellement besoin :

    | Besoin | Import |
    | --- | --- |
    | Fonctions d’aide de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Fonctions d’aide de réveil Heartbeat, d’événement et de visibilité | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file de livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité du canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Fonctions d’aide sûres pour les chemins de fichiers/médias locaux | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch tenant compte du répartiteur | `openclaw/plugin-sdk/runtime-fetch` |
    | Fonctions d’aide de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique de répartiteur SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Fonctions d’aide de charge utile de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Fonctions d’aide de formatage des erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Fonctions d’aide de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins groupés sont protégés par scanner contre `infra-runtime`; le
    code du dépôt ne peut donc pas régresser vers le large barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Le nouveau code de route de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms route-key et comparable-target restent des alias de
    compatibilité pendant la fenêtre de migration, mais les nouveaux plugins
    doivent utiliser les noms de route qui décrivent directement le comportement :

    | Ancienne fonction d’aide | Fonction d’aide moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les fonctions d’aide de route modernes normalisent `{ channel, to, accountId, threadId }`
    de manière cohérente entre les approbations natives, la suppression de
    réponse, la déduplication entrante, la livraison Cron et le routage de session.

    N’ajoutez pas de nouvelles utilisations de `ChannelMessagingAdapter.parseExplicitTarget`
    ni des fonctions d’aide de route chargée adossées au parseur (`parseExplicitTargetForLoadedChannel`
    ou `resolveRouteTargetForLoadedChannel`), ni de
    `resolveChannelRouteTargetWithParser(...)` depuis `plugin-sdk/channel-route`.
    Ces points d’accroche sont obsolètes et ne restent présents que pour les
    anciens plugins pendant la fenêtre de migration. Les nouveaux plugins de
    canal doivent utiliser `messaging.targetResolver.resolveTarget(...)` pour la
    normalisation des identifiants de cible et le fallback en cas d’absence dans
    le répertoire, `messaging.inferTargetChatType(...)` lorsque le cœur a besoin
    d’un type de pair précoce, et `messaging.resolveOutboundSessionRoute(...)`
    pour l’identité de session et de thread native au fournisseur.

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
  | `plugin-sdk/plugin-entry` | Assistant canonique d’entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport global hérité pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration | Traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants d’exécution au moment de la configuration | `createSetupTranslator`, adaptateurs de correctif de configuration sûrs à importer, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsolète d’adaptateur de configuration | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multicompte | Assistants de liste/configuration/contrôle d’action de comptes |
  | `plugin-sdk/account-id` | Assistants d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Assistants ciblés de compte | Assistants de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse, de la saisie et de la livraison source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et assistants d’accès DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schéma de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux plugins doivent définir des schémas locaux au plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration de commandes Telegram | Normalisation des noms de commande, réduction des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + générateur d’enveloppe |
  | `plugin-sdk/channel-inbound` | Assistants de réception entrante | Construction de contexte, formatage, racines, exécuteurs, envoi de réponse préparée et prédicats d’envoi |
  | `plugin-sdk/messaging-targets` | Chemin d’importation obsolète pour l’analyse de cible | Utilisez `plugin-sdk/channel-targets` pour les assistants génériques d’analyse de cible, `plugin-sdk/channel-route` pour la comparaison de routes, et `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` appartenant au plugin pour la résolution de cible propre au fournisseur |
  | `plugin-sdk/outbound-media` | Assistants de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Assistants de cycle de vie des messages sortants | Adaptateurs de message, accusés de réception, assistants d’envoi durable, assistants de prévisualisation en direct/streaming, options de réponse, assistants de cycle de vie, identité sortante et planification de charge utile |
  | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fil | Cycle de vie des liaisons de fil et assistants d’adaptateur |
  | `plugin-sdk/agent-media-payload` | Assistants hérités de charge utile média | Générateur de charge utile média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant du plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants d’exécution étendus | Assistants d’exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Assistants ciblés d’environnement d’exécution | Environnement de journalisation/exécution, délai d’expiration, nouvelle tentative et assistants de backoff |
  | `plugin-sdk/plugin-runtime` | Assistants partagés d’exécution de plugin | Assistants de commandes/crochets/http/interactifs de plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de crochets | Assistants partagés de pipeline Webhook/interne |
  | `plugin-sdk/lazy-runtime` | Assistants d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants d’exécution partagés |
  | `plugin-sdk/cli-runtime` | Assistants d’exécution CLI | Formatage de commandes, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway, assistant de démarrage prêt pour la boucle d’événements et assistants de correctif d’état de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation de commandes Telegram stables au repli quand la surface de contrat Telegram groupée est indisponible |
  | `plugin-sdk/approval-runtime` | Assistants d’invite d’approbation | Charge utile d’approbation exec/plugin, assistants de capacité/profil d’approbation, routage/exécution d’approbation native et formatage de chemin d’affichage d’approbation structurée |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’authentification d’approbation | Résolution d’approbateur, authentification d’action dans la même conversation |
  | `plugin-sdk/approval-client-runtime` | Assistants client d’approbation | Assistants natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal chauds |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants d’exécution de gestionnaire d’approbation plus étendus ; préférez les limites adaptateur/Gateway plus étroites quand elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte d’exécution de canal | Assistants génériques d’enregistrement/obtention/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, contrôle DM, fichiers/chemins bornés à la racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF | Assistants de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants d’exécution SSRF | Dispatcher épinglé, fetch protégé, assistants de politique SSRF |
  | `plugin-sdk/system-event-runtime` | Assistants d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Assistants Heartbeat | Réveil, événement et visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Assistants de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Assistants d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Assistants de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Assistants d’accès aux fichiers | Assistants sûrs de chemins de fichier/média locaux |
  | `plugin-sdk/transport-ready-runtime` | Assistants de disponibilité du transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Assistants de politique d’approbation exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de contrôle diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants fetch/proxy enveloppés | `resolveFetch`, assistants proxy, assistants d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politiques |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation et mappage d’entrée | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Contrôle de commandes et assistants de surface de commandes | `resolveControlCommandGate`, assistants d’autorisation d’expéditeur, assistants de registre de commandes incluant le formatage de menu d’arguments dynamiques |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide de commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse d’entrée secrète | Assistants d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Assistants de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde de corps Webhook | Assistants de lecture/limite de corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Envoi entrant, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés d’envoi de réponse | Finalisation, envoi fournisseur et assistants d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique de réponses | `createChannelHistoryWindow` ; exports de compatibilité obsolètes d’assistants de map comme `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage de réponse | Assistants de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de magasin de session | Chemin de magasin + assistants updated-at |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Générateurs de résumés d’état de canal/compte, valeurs par défaut d’état d’exécution, helpers de métadonnées d’incident |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL sous forme de chaînes depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commandes temporisées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs pour outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Enregistreur de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers de configuration de fournisseurs locaux/auto-hébergés sélectionnés | Helpers de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI | Mêmes helpers de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification d’exécution de fournisseur | Helpers de résolution de clé d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé d’API de fournisseur | Helpers d’intégration/écriture de profil de clé d’API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Helpers de sélection de fournisseur | Sélection de fournisseur configurée ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement de fournisseur | Helpers de recherche de variable d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politique de relecture, helpers de point de terminaison de fournisseur et helpers de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue de fournisseurs | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Helpers de configuration d’intégration |
  | `plugin-sdk/provider-http` | Helpers HTTP de fournisseur | Helpers génériques de capacité HTTP/point de terminaison de fournisseur, y compris les helpers de formulaire multipart pour transcription audio |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch de fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web de fournisseur | Helpers ciblés de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web de fournisseur | Helpers ciblés de contrat de configuration/identifiants de recherche web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/modificateurs d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web de fournisseur | Helpers d’enregistrement/cache/exécution de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité d’outils/schémas de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schémas + diagnostics DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Helpers d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres helpers d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrapper de flux et helpers partagés de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport de fournisseur | Helpers de transport natif de fournisseur, tels que fetch protégé, extraction de texte de résultat d’outil, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers multimédias partagés | Helpers de récupération/transformation/stockage de médias, sondage des dimensions vidéo adossé à ffprobe et générateurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération multimédia | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension multimédia | Types de fournisseur de compréhension multimédia et exports de helpers image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Export large de compatibilité texte obsolète | Utilisez `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Helpers de découpage de texte | Helper de découpage de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de fournisseur de parole et helpers de directive, registre et validation destinés aux fournisseurs, ainsi qu’un générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau de parole partagé | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de fournisseur, helpers de registre et helper partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voix en temps réel | Types de fournisseur, helpers de registre/résolution, helpers de session de pont, files partagées de réponse vocale d’agent, contrôle vocal de série active, santé des transcriptions/événements, suppression d’écho, correspondance des questions de consultation, coordination de consultation forcée, suivi du contexte de tour, suivi de l’activité de sortie et helpers rapides de consultation de contexte |
  | `plugin-sdk/image-generation` | Helpers de génération d’images | Types de fournisseur de génération d’images, helpers d’URL de ressources/données d’image et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et helpers de registre |
  | `plugin-sdk/music-generation` | Helpers de génération de musique | Types de fournisseur/requête/résultat de génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Helpers de génération de vidéos | Types de fournisseur/requête/résultat de génération de vidéos |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération de vidéos | Types de génération de vidéos, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports de préambule partagé de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d’autorisation | Helpers de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes | Utilisez `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Helpers de garde Direct-DM | Helpers ciblés de politique de garde pré-crypto |
  | `plugin-sdk/extension-shared` | Helpers d’extension partagés | Primitives de helpers de canal passif/état et proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible Webhook | Registre de cibles Webhook et helpers d’installation de route |
  | `plugin-sdk/webhook-path` | Alias obsolète de chemin Webhook | Utilisez `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Helpers de médias web partagés | Helpers de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport de compatibilité Zod obsolète | Importez `zod` directement depuis `zod` |
  | `plugin-sdk/memory-core` | Helpers memory-core groupés | Surface de helpers de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’index/recherche de mémoire |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registre d’embeddings mémoire | Helpers légers de registre de fournisseurs d’embeddings mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte de mémoire | Exports du moteur de fondation de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte de mémoire | Contrats d’embeddings mémoire, accès au registre, fournisseur local et helpers génériques de lot/distants ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte de mémoire | Exports du moteur QMD de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte de mémoire | Exports du moteur de stockage de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte de mémoire | Helpers multimodaux de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte de mémoire | Helpers de requête de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte de mémoire | Helpers de secret de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias d’événement mémoire obsolète | Utilisez `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte de mémoire | Helpers d’état de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte de mémoire | Helpers d’exécution CLI de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution centrale de l’hôte de mémoire | Helpers d’exécution centrale de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/exécution de l’hôte de mémoire | Helpers de fichier/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution centrale de l’hôte de mémoire | Alias neutre vis-à-vis des fournisseurs pour les helpers d’exécution centrale de l’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte de mémoire | Alias neutre vis-à-vis des fournisseurs pour les helpers de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias obsolète de fichier/exécution mémoire | Utilisez `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Helpers Markdown gérés | Helpers partagés de Markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche de mémoire active | Façade d’exécution paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias obsolète d’état de l’hôte de mémoire | Utilisez `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Barrel de compatibilité obsolète local au dépôt ; utilisez des sous-chemins de test ciblés locaux au dépôt, tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau est volontairement le sous-ensemble commun de migration, pas toute la
surface du SDK. L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports de package sont générés
à partir du sous-ensemble public.

Les points d’extension d’aide réservés aux plugins groupés ont été retirés de la
carte d’export du SDK public, sauf pour les façades de compatibilité
explicitement documentées comme la couche `plugin-sdk/discord` obsolète,
conservée pour le package publié `@openclaw/discord@2026.3.13`. Les aides
spécifiques à un propriétaire vivent dans le package du plugin propriétaire ; le
comportement hôte partagé doit passer par des contrats SDK génériques comme
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
`plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus étroit qui correspond à la tâche. Si vous ne trouvez
pas d’export, consultez la source dans `src/plugin-sdk/` ou demandez aux
mainteneurs quel contrat générique doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent au SDK de plugin, au contrat de
fournisseur, à la surface runtime et au manifeste. Chacune fonctionne encore
aujourd’hui, mais sera supprimée dans une future version majeure. L’entrée sous
chaque élément mappe l’ancienne API vers son remplacement canonique.

<AccordionGroup>
  <Accordion title="Constructeurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures,
    mêmes exports - simplement importés depuis le sous-chemin plus étroit.
    `command-auth` les réexporte comme implémentations de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Aides de filtrage par mention → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` - renvoie
    un seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Couche runtime de canal et aides d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est une couche de compatibilité pour
    les anciens plugins de canal. Ne l’importez pas depuis du nouveau code ;
    utilisez `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les
    objets runtime.

    Les aides `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    obsolètes avec les exports de canal « actions » bruts. Exposez plutôt les
    capacités via la surface sémantique `presentation` - les plugins de canal
    déclarent ce qu’ils affichent (cartes, boutons, sélecteurs) plutôt que les
    noms d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Aide tool() du fournisseur de recherche web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` depuis
    `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin
    fournisseur. OpenClaw n’a plus besoin de l’aide du SDK pour enregistrer
    l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de
    prompt plate en texte brut à partir des messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte
    utilisateur. Les plugins de canal attachent les métadonnées de routage
    (fil, sujet, réponse à, réactions) comme champs typés au lieu de les
    concaténer dans une chaîne de prompt. L’aide `formatAgentEnvelope(...)`
    reste prise en charge pour les enveloppes synthétisées destinées à
    l’assistant, mais les enveloppes entrantes en texte brut sont en voie de
    disparition.

    Zones concernées : `inbound_claim`, `message_received` et tout plugin de
    canal personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Ancien** : `api.on("deactivate", handler)`.

    **Nouveau** : `api.on("gateway_stop", handler)`. L’événement et le contexte
    correspondent au même contrat de nettoyage à l’arrêt ; seul le nom du hook
    change.

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

    `deactivate` reste câblé comme alias de compatibilité obsolète jusqu’après
    le 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → liaison de fil par le noyau">
    **Ancien** : `api.on("subagent_spawning", handler)` renvoyant
    `threadBindingReady` ou `deliveryOrigin`.

    **Nouveau** : laissez le noyau préparer les liaisons de sous-agent
    `thread: true` via l’adaptateur de liaison de session de canal. Utilisez
    `api.on("subagent_spawned", handler)` uniquement pour l’observation
    post-lancement.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` restent uniquement
    des surfaces de compatibilité obsolètes pendant la migration des plugins
    externes.

  </Accordion>

  <Accordion title="Types de découverte de fournisseurs → types de catalogue de fournisseurs">
    Quatre alias de type de découverte sont désormais de fines enveloppes autour
    des types de l’ère catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus l’ancien sac statique `ProviderCapabilities` - les plugins
    fournisseurs doivent utiliser des hooks fournisseur explicites comme
    `buildReplayPolicy`, `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un
    objet statique.

  </Accordion>

  <Accordion title="Hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un seul `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et
    une liste de niveaux classés. OpenClaw rétrograde automatiquement les
    anciennes valeurs stockées selon le rang du profil.

    Le contexte inclut `provider`, `modelId`, le `reasoning` fusionné facultatif
    et les faits `compat` de modèle fusionnés facultatifs. Les plugins
    fournisseurs peuvent utiliser ces faits de catalogue pour exposer un profil
    spécifique au modèle uniquement lorsque le contrat de requête configuré le
    prend en charge.

    Implémentez un hook au lieu de trois. Les anciens hooks continuent de
    fonctionner pendant la fenêtre de dépréciation, mais ne sont pas composés
    avec le résultat du profil.

  </Accordion>

  <Accordion title="Fournisseurs d’authentification externes → contracts.externalAuthProviders">
    **Ancien** : implémenter des hooks d’authentification externe sans déclarer
    le fournisseur dans le manifeste du plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste
    du plugin **et** implémentez `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Recherche de variables d’environnement de fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste :
    `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : reflétez la même recherche de variable d’environnement dans
    `setup.providers[].envVars` sur le manifeste. Cela consolide les métadonnées
    d’environnement de configuration/statut à un seul endroit et évite de
    démarrer le runtime du plugin seulement pour répondre aux recherches de
    variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de
    compatibilité jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement de plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API d’état mémoire -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les aides additives de
    prompt et de corpus (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) ne sont pas affectées.

  </Accordion>

  <Accordion title="API de fournisseur d’embeddings mémoire">
    **Ancien** : `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nouveau** : `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Le contrat de fournisseur d’embeddings générique est réutilisable hors de la
    mémoire et constitue le chemin pris en charge pour les nouveaux
    fournisseurs. L’API d’enregistrement spécifique à la mémoire reste câblée
    comme compatibilité obsolète pendant la migration des fournisseurs
    existants. Les rapports d’inspection de plugin signalent l’usage non groupé
    comme dette de compatibilité.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux anciens alias de type restent exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                       | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode runtime `readSession` est obsolète au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur
    task-flow actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve le runtime de mutation
    TaskFlow géré pour les plugins qui créent, mettent à jour, annulent ou
    exécutent des tâches enfant depuis un flow. Utilisez `runtime.tasks.flows`
    lorsque le plugin n’a besoin que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabriques d’extension intégrées → middleware de résultat d’outil d’agent">
    Couvert dans « Comment migrer → Migrer les extensions de résultat d’outil
    intégrées vers le middleware » ci-dessus. Inclus ici par souci
    d’exhaustivité : le chemin `api.registerEmbeddedExtensionFactory(...)`,
    supprimé et réservé à l’exécuteur intégré, est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste runtime
    explicite dans `contracts.agentToolResultMiddleware`.
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
Les dépréciations au niveau des extensions (dans les plugins de canal/fournisseur
groupés sous `extensions/`) sont suivies dans leurs propres barrels `api.ts` et
`runtime-api.ts`. Elles n’affectent pas les contrats des plugins tiers et ne
sont pas listées ici. Si vous consommez directement le barrel local d’un plugin
groupé, lisez les commentaires de dépréciation dans ce barrel avant la mise à
niveau.
</Note>

## Calendrier de suppression

| Quand                         | Ce qui se passe                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------- |
| **Maintenant**                | Les surfaces obsolètes émettent des avertissements à l’exécution                 |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Articles connexes

- [Bien démarrer](/fr/plugins/building-plugins) - créez votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports de sous-chemins
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - créer des plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - créer des plugins de fournisseur
- [Internes des plugins](/fr/plugins/architecture) - exploration approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) - référence du schéma du manifeste
