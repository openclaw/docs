---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture moderne des Plugins
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK de plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-07-04T10:40:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de Plugin moderne avec des imports ciblés et documentés. Si votre Plugin a été créé avant la nouvelle architecture, ce guide vous aide à le migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** - un import unique qui réexportait des dizaines
  d’assistants. Il a été introduit pour maintenir le fonctionnement des anciens Plugins basés sur des hooks pendant la construction de la nouvelle architecture de Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - un large barrel d’assistants d’exécution qui
  mélangeait événements système, état Heartbeat, files de livraison, assistants fetch/proxy,
  assistants de fichiers, types d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large barrel de compatibilité de configuration
  qui conserve encore des assistants directs de chargement/écriture dépréciés pendant la fenêtre de migration.
- **`openclaw/extension-api`** - un pont qui donnait aux Plugins un accès direct aux
  assistants côté hôte, comme l’exécuteur d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension groupée réservé à l’exécuteur intégré,
  désormais supprimé, qui pouvait observer les événements de l’exécuteur intégré tels que
  `tool_result`.

Les larges surfaces d’import sont maintenant **dépréciées**. Elles fonctionnent encore à l’exécution,
mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants devraient migrer avant
que la prochaine version majeure ne les supprime. L’API d’enregistrement de fabrique d’extension
réservée à l’exécuteur intégré a été supprimée ; utilisez plutôt un middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans le même
changement qui introduit un remplacement. Les changements de contrat incompatibles doivent d’abord passer
par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports SDK, champs de manifeste, API de configuration, hooks et comportements
d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
  Les anciens enregistrements de fabrique d’extension intégrée ne se chargent déjà plus.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer un assistant chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** - les réexports larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** - aucun moyen de distinguer les exports stables des exports internes

Le SDK de Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome, doté d’un objectif clair et d’un contrat documenté.

Les coutures de commodité des anciens fournisseurs pour les canaux groupés ont également disparu.
Les coutures d’assistants de marque de canal étaient des raccourcis privés du monorepo, pas des
contrats de Plugin stables. Utilisez plutôt des sous-chemins SDK génériques et étroits. Dans l’espace de travail
du Plugin groupé, gardez les assistants appartenant au fournisseur dans le propre `api.ts` ou
`runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs groupés :

- Anthropic garde les assistants de flux propres à Claude dans sa propre couture `api.ts` /
  `contract-api.ts`
- OpenAI garde les constructeurs de fournisseur, les assistants de modèle par défaut et les constructeurs
  de fournisseur temps réel dans son propre `api.ts`
- OpenRouter garde le constructeur de fournisseur et les assistants d’onboarding/configuration dans son propre
  `api.ts`

## Plan de migration de Talk et de la voix en temps réel

Le code Talk pour la voix en temps réel, la téléphonie, les réunions et le navigateur passe d’une
comptabilité des tours locale à chaque surface à un contrôleur de session Talk partagé exporté par
`openclaw/plugin-sdk/realtime-voice`. Le nouveau contrôleur possède l’enveloppe commune des événements Talk,
l’état de tour actif, l’état de capture, l’état de sortie audio, l’historique récent des
événements et le rejet des tours obsolètes. Les Plugins fournisseurs doivent continuer à posséder
les sessions temps réel propres au fournisseur ; les Plugins de surface doivent continuer à posséder la capture,
la lecture, la téléphonie et les particularités de réunion.

Cette migration Talk est volontairement nette et incompatible :

1. Garder les primitives partagées de contrôleur/exécution dans
   `plugin-sdk/realtime-voice`.
2. Migrer les surfaces groupées vers le contrôleur partagé : relais navigateur,
   transfert de salle gérée, temps réel d’appel vocal, STT en streaming d’appel vocal, temps réel Google
   Meet et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*` et
   `talk.client.*`.
4. Annoncer un seul canal d’événements Talk actif dans
   `hello-ok.features.events` du Gateway : `talk.event`.
5. Supprimer l’ancien endpoint HTTP temps réel et tout chemin de remplacement
   des instructions au moment de la requête.

Le nouveau code ne devrait pas appeler `createTalkEventSequencer(...)` directement, sauf s’il
implémente un adaptateur bas niveau ou un fixture de test. Préférez le contrôleur partagé
afin que les événements limités à un tour ne puissent pas être émis sans identifiant de tour, que les appels `turnEnd` /
`turnCancel` obsolètes ne puissent pas effacer un tour actif plus récent, et que les événements de cycle de vie
de sortie audio restent cohérents entre la téléphonie, les réunions, le relais navigateur, le transfert
de salle gérée et les clients Talk natifs.

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

Les sessions WebRTC/provider-websocket appartenant au navigateur utilisent `talk.client.create`,
car le navigateur possède la négociation fournisseur et le transport média tandis que le
Gateway possède les identifiants, les instructions et la politique d’outils. `talk.session.*` est la
surface commune gérée par le Gateway pour le temps réel gateway-relay, la transcription
gateway-relay et les sessions STT/TTS natives managed-room.

Les anciennes configurations qui plaçaient les sélecteurs temps réel à côté de `talk.provider` /
`talk.providers` doivent être réparées avec `openclaw doctor --fix` ; l’exécution Talk
ne réinterprète pas la configuration de fournisseur speech/TTS comme configuration de fournisseur temps réel.

Les combinaisons prises en charge par `talk.session.create` sont volontairement limitées :

| Mode            | Transport       | Cerveau         | Propriétaire       | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio fournisseur full-duplex relayé par le Gateway ; les appels d’outils sont routés via l’outil agent-consult.   |
| `transcription` | `gateway-relay` | `none`          | Gateway            | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription. |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de style push-to-talk et talkie-walkie où le client possède la capture/lecture et le Gateway possède l’état de tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode de salle réservé aux administrateurs pour les surfaces internes fiables qui exécutent directement les actions d’outil du Gateway. |

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

  | Méthode                         | S’applique à                                            | Contrat                                                                                                                                                                                  |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajoute un fragment audio PCM en base64 à la session fournisseur détenue par la même connexion Gateway.                                                                                   |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarre un tour utilisateur de salle gérée.                                                                                                                                              |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Termine le tour actif après validation des tours obsolètes.                                                                                                                              |
  | `talk.session.cancelTurn`       | toutes les sessions détenues par le Gateway             | Annule le travail de capture/fournisseur/agent/TTS actif pour un tour.                                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrête la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Termine un appel d’outil fournisseur émis par le relais ; passez `options.willContinue` pour une sortie intermédiaire ou `options.suppressResponse` pour satisfaire l’appel sans autre réponse de l’assistant. |
  | `talk.session.steer`            | sessions Talk adossées à un agent                       | Envoie une commande vocale `status`, `steer`, `cancel` ou `followup` à l’exécution intégrée active résolue depuis la session Talk.                                                       |
  | `talk.session.close`            | toutes les sessions unifiées                            | Arrête les sessions de relais ou révoque l’état de salle gérée, puis oublie l’identifiant de session unifiée.                                                                            |

  N’introduisez pas de cas particuliers de fournisseur ou de plateforme dans le cœur pour que cela fonctionne.
  Le cœur possède la sémantique des sessions Talk. Les Plugins fournisseurs possèdent la configuration des sessions fournisseur.
  Les appels vocaux et Google Meet possèdent les adaptateurs de téléphonie/réunion. Les navigateurs et les applications natives
  possèdent l’expérience utilisateur de capture/lecture des appareils.

  ## Politique de compatibilité

  Pour les Plugins externes, le travail de compatibilité suit cet ordre :

  1. ajouter le nouveau contrat
  2. conserver l’ancien comportement câblé via un adaptateur de compatibilité
  3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
  4. couvrir les deux chemins dans les tests
  5. documenter l’obsolescence et le chemin de migration
  6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour
  des nombres compacts, `--owner <id>` pour un Plugin ou propriétaire de compatibilité, et
  `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des enregistrements
  de compatibilité arrivés à échéance, des imports SDK réservés entre propriétaires ou des sous-chemins SDK réservés
  inutilisés. Le rapport groupe les enregistrements de
  compatibilité obsolètes par date de suppression, compte les références locales de code/docs,
  met en évidence les imports SDK réservés entre propriétaires et résume le pont SDK privé
  de l’hôte mémoire afin que le nettoyage de compatibilité reste explicite au lieu de
  s’appuyer sur des recherches ponctuelles. Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ;
  les exports d’aides réservées inutilisés doivent être retirés du SDK public.

  Si un champ de manifeste est toujours accepté, les auteurs de Plugins peuvent continuer à l’utiliser jusqu’à ce que
  les docs et diagnostics indiquent le contraire. Le nouveau code doit préférer le remplacement
  documenté, mais les Plugins existants ne doivent pas casser pendant les versions mineures
  ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Les Plugins groupés doivent cesser d’appeler
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)` directement. Préférez la configuration qui a
    déjà été transmise au chemin d’appel actif. Les gestionnaires à longue durée de vie qui ont besoin de
    l’instantané du processus actuel peuvent utiliser `api.runtime.config.current()`. Les outils
    d’agent à longue durée de vie doivent utiliser `ctx.getRuntimeConfig()` du contexte d’outil dans
    `execute` afin qu’un outil créé avant une écriture de configuration voie tout de même la
    configuration d’exécution actualisée.

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
    Les résultats de mutation incluent un résumé typé `followUp` pour les tests et la journalisation ;
    le Gateway reste responsable de l’application ou de la planification du redémarrage.
    `loadConfig` et `writeConfigFile` restent des aides de compatibilité obsolètes
    pour les Plugins externes pendant la fenêtre de migration et avertissent une fois avec
    le code de compatibilité `runtime-config-load-write`. Les Plugins groupés et le code
    d’exécution du dépôt sont protégés par des garde-fous de scanner dans
    `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation de Plugin de production
    échoue immédiatement, les écritures directes de configuration échouent, les méthodes du serveur Gateway doivent utiliser
    l’instantané d’exécution de la requête, les aides d’envoi/action/client de canal d’exécution
    doivent recevoir la configuration depuis leur frontière, et les modules d’exécution à longue durée de vie ont
    zéro appel ambiant `loadConfig()` autorisé.

    Le nouveau code de Plugin doit aussi éviter d’importer le large barrel de compatibilité
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit qui correspond
    au travail :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration tels que `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané d’exécution actuel | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Aides de stockage de session | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de tableau Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Aides d’exécution de stratégie de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution d’entrée secrète | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les Plugins groupés et leurs tests sont protégés par scanner contre le large
    barrel afin que les imports et mocks restent locaux au comportement dont ils ont besoin. Le large
    barrel existe toujours pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Les Plugins groupés doivent remplacer les gestionnaires de résultats d’outil
    `api.registerEmbeddedExtensionFactory(...)` propres au runner intégré par un
    middleware neutre vis-à-vis de l’exécution.

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

    Les Plugins installés peuvent aussi enregistrer un middleware de résultat d’outil lorsqu’ils sont
    explicitement activés et déclarent chaque exécution ciblée dans
    `contracts.agentToolResultMiddleware`. Les enregistrements de middleware installé
    non déclarés sont rejetés.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Les Plugins de canal prenant en charge les approbations exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte d’exécution.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été retiré du contrat public des Plugins de canal ;
      déplacez les champs de livraison/natif/rendu vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation à cet endroit ne sont plus lus par le cœur
    - Enregistrez les objets d’exécution possédés par le canal, tels que les clients, jetons ou applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage possédés par le Plugin depuis les gestionnaires d’approbation natifs ;
      le cœur possède désormais les avis routés ailleurs à partir des résultats de livraison réels
    - Lors du passage de `channelRuntime` dans `createChannelManager(...)`, fournissez une
      surface réelle `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

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

    Si votre appelant ne s’appuie pas intentionnellement sur le repli shell, ne définissez pas
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

    Pour les aides côté hôte, utilisez l’exécution de Plugin injectée au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres assistants de pont hérités :

    | Ancienne importation | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | assistants du magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Remplacer les importations infra-runtime larges">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface d’assistance ciblée
    dont il a réellement besoin :

    | Besoin | Importation |
    | --- | --- |
    | Assistants de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Assistants de réveil, d’événement et de visibilité Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file des livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire et persistants | `openclaw/plugin-sdk/dedupe-runtime` |
    | Assistants sûrs de chemins de fichiers locaux/médias | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` compatible avec le répartiteur | `openclaw/plugin-sdk/runtime-fetch` |
    | Assistants de proxy et de `fetch` protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique de répartiteur SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Charge utile de réponse d’approbation et assistants de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Assistants de formatage des erreurs | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Assistants de jetons sécurisés | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins intégrés sont protégés par scanner contre `infra-runtime`, donc le code du dépôt
    ne peut pas régresser vers le barrel large.

  </Step>

  <Step title="Migrer les assistants de route de canal">
    Le nouveau code de route de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms de clé de route et de cible comparable restent comme alias
    de compatibilité pendant la fenêtre de migration, mais les nouveaux plugins doivent utiliser les noms de route
    qui décrivent directement le comportement :

    | Ancien assistant | Assistant moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les assistants de route modernes normalisent `{ channel, to, accountId, threadId }`
    de façon cohérente pour les approbations natives, la suppression de réponse, la déduplication entrante,
    la livraison Cron et le routage de session.

    N’ajoutez pas de nouvelles utilisations de `ChannelMessagingAdapter.parseExplicitTarget` ni
    des assistants de route chargée adossés à l’analyseur (`parseExplicitTargetForLoadedChannel`
    ou `resolveRouteTargetForLoadedChannel`) ni de
    `resolveChannelRouteTargetWithParser(...)` depuis `plugin-sdk/channel-route`.
    Ces points d’accroche sont obsolètes et ne restent présents que pour les anciens plugins pendant la
    fenêtre de migration. Les nouveaux plugins de canal doivent utiliser
    `messaging.targetResolver.resolveTarget(...)` pour la normalisation des identifiants de cible
    et le repli en cas d’absence dans le répertoire, `messaging.inferTargetChatType(...)` lorsque le cœur
    a besoin d’un type de pair précoce, et `messaging.resolveOutboundSessionRoute(...)`
    pour la session native au fournisseur et l’identité de fil.

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Common import path table">
  | Chemin d’importation | Objectif | Exports principaux |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Utilitaire d’entrée canonique de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport global hérité pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilitaire d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilitaires partagés de l’assistant de configuration | Traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Utilitaires runtime au moment de la configuration | `createSetupTranslator`, adaptateurs de correctifs de configuration sûrs à importer, utilitaires de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsolète d’adaptateur de configuration | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Utilitaires d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilitaires multicomptes | Utilitaires de liste de comptes/configuration/verrouillage d’action |
  | `plugin-sdk/account-id` | Utilitaires d’identifiants de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Utilitaires de recherche de compte | Utilitaires de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Utilitaires de compte ciblés | Utilitaires de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse, de la saisie et de la livraison depuis la source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et utilitaires d’accès DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives partagées de schéma de configuration de canal et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux plugins doivent définir des schémas locaux au Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Utilitaires de configuration des commandes Telegram | Normalisation des noms de commande, troncature des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Utilitaires d’enveloppe entrante | Utilitaires partagés de route + générateurs d’enveloppe |
  | `plugin-sdk/channel-inbound` | Utilitaires de réception entrante | Construction de contexte, formatage, racines, lanceurs, envoi préparé des réponses et prédicats d’envoi |
  | `plugin-sdk/messaging-targets` | Chemin d’importation obsolète pour l’analyse des cibles | Utilisez `plugin-sdk/channel-targets` pour les utilitaires génériques d’analyse de cible, `plugin-sdk/channel-route` pour la comparaison de routes, et `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` appartenant au Plugin pour la résolution de cible propre au fournisseur |
  | `plugin-sdk/outbound-media` | Utilitaires de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Utilitaires de cycle de vie des messages sortants | Adaptateurs de messages, accusés de réception, utilitaires d’envoi durable, utilitaires d’aperçu en direct/streaming, options de réponse, utilitaires de cycle de vie, identité sortante et planification de charge utile |
  | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète | Utilisez `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Utilitaires de liaison de fils | Utilitaires de cycle de vie et d’adaptateur pour la liaison de fils |
  | `plugin-sdk/agent-media-payload` | Utilitaires hérités de charges utiles média | Générateur de charge utile média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires runtime de canal hérité uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilitaires runtime larges | Utilitaires runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Utilitaires ciblés d’environnement runtime | Utilitaires de journalisation/environnement runtime, délai d’expiration, nouvelle tentative et temporisation exponentielle |
  | `plugin-sdk/plugin-runtime` | Utilitaires partagés de runtime de Plugin | Utilitaires de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Utilitaires de pipeline de hooks | Utilitaires partagés de pipeline Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Utilitaires runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilitaires de processus | Utilitaires exec partagés |
  | `plugin-sdk/cli-runtime` | Utilitaires runtime de CLI | Formatage des commandes, attentes, utilitaires de version |
  | `plugin-sdk/gateway-runtime` | Utilitaires Gateway | Client Gateway, utilitaire de démarrage prêt pour la boucle d’événements, résolution de l’hôte LAN annoncé et utilitaires de correctif d’état de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Utilitaires de commandes Telegram | Utilitaires de validation de commandes Telegram stables avec repli lorsque la surface de contrat Telegram groupée est indisponible |
  | `plugin-sdk/approval-runtime` | Utilitaires d’invite d’approbation | Charge utile d’approbation exec/Plugin, utilitaires de capacité/profil d’approbation, utilitaires natifs de routage/runtime d’approbation et formatage structuré du chemin d’affichage de l’approbation |
  | `plugin-sdk/approval-auth-runtime` | Utilitaires d’authentification d’approbation | Résolution d’approbateur, authentification d’action dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Utilitaires client d’approbation | Utilitaires natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Utilitaires de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Utilitaires Gateway d’approbation | Utilitaire partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilitaires d’adaptateur d’approbation | Utilitaires légers de chargement d’adaptateur d’approbation natif pour les points d’entrée de canal critiques |
  | `plugin-sdk/approval-handler-runtime` | Utilitaires de gestionnaire d’approbation | Utilitaires runtime plus larges de gestionnaire d’approbation ; préférez les coutures d’adaptateur/Gateway plus ciblées lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Utilitaires de cible d’approbation | Utilitaires natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Utilitaires de réponse d’approbation | Utilitaires de charge utile de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Utilitaires de contexte runtime de canal | Utilitaires génériques d’enregistrement/récupération/surveillance du contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Utilitaires de sécurité | Utilitaires partagés de confiance, verrouillage DM, fichiers/chemins bornés à la racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Utilitaires de politique SSRF | Utilitaires de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Utilitaires runtime SSRF | Répartiteur épinglé, fetch protégé, utilitaires de politique SSRF |
  | `plugin-sdk/system-event-runtime` | Utilitaires d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Utilitaires Heartbeat | Utilitaires de réveil, d’événement et de visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Utilitaires de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Utilitaires d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Utilitaires de déduplication | Caches de déduplication en mémoire et adossés à un stockage persistant |
  | `plugin-sdk/file-access-runtime` | Utilitaires d’accès aux fichiers | Utilitaires sûrs de chemins de fichiers/médias locaux |
  | `plugin-sdk/transport-ready-runtime` | Utilitaires de préparation du transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Utilitaires de politique d’approbation exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Utilitaires de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilitaires de verrouillage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilitaires de formatage d’erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, utilitaires de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Utilitaires de fetch/proxy encapsulé | `resolveFetch`, utilitaires de proxy, utilitaires d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Utilitaires de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilitaires de nouvelle tentative | `RetryConfig`, `retryAsync`, lanceurs de politiques |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation et mappage d’entrée | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Utilitaires de verrouillage de commande et de surface de commande | `resolveControlCommandGate`, utilitaires d’autorisation d’expéditeur, utilitaires de registre de commandes incluant le formatage dynamique du menu d’arguments |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse de saisie de secret | Utilitaires de saisie de secret |
  | `plugin-sdk/webhook-ingress` | Utilitaires de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilitaires de garde du corps Webhook | Utilitaires de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime de réponse partagé | Envoi entrant, Heartbeat, planificateur de réponses, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Utilitaires ciblés d’envoi de réponse | Finalisation, envoi par fournisseur et utilitaires d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Utilitaires d’historique de réponses | `createChannelHistoryWindow` ; exports de compatibilité obsolètes pour utilitaires de map tels que `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilitaires de découpage de réponses | Utilitaires de découpage texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Utilitaires de magasin de sessions | Utilitaires de chemin de magasin + date de mise à jour |
  | `plugin-sdk/state-paths` | Utilitaires de chemins d’état | Utilitaires de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Utilitaires de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilitaires de normalisation des clés de session |
  | `plugin-sdk/status-helpers` | Utilitaires d’état de canal | Constructeurs de résumés d’état de canal/compte, valeurs par défaut d’état d’exécution, utilitaires de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Utilitaires de résolution de cible | Utilitaires partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation de chaîne | Utilitaires de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Utilitaires d’URL de requête | Extraire les URL de chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Utilitaires de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Utilitaires de chemin temporaire | Utilitaires partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Utilitaires de journalisation | Journaliseur de sous-système et utilitaires de caviardage |
  | `plugin-sdk/markdown-table-runtime` | Utilitaires de tableau Markdown | Utilitaires de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Utilitaires organisés de configuration de fournisseur local/auto-hébergé | Utilitaires de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Utilitaires ciblés de configuration de fournisseur auto-hébergé compatible OpenAI | Mêmes utilitaires de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Utilitaires d’authentification d’exécution du fournisseur | Utilitaires de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Utilitaires de configuration de clé API de fournisseur | Utilitaires d’intégration/d’écriture de profil pour clé API |
  | `plugin-sdk/provider-auth-result` | Utilitaires de résultat d’authentification de fournisseur | Constructeur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Utilitaires de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Utilitaires de variables d’environnement de fournisseur | Utilitaires de recherche de variable d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Utilitaires partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, utilitaires de point de terminaison de fournisseur et utilitaires de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Utilitaires partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Utilitaires de configuration d’intégration |
  | `plugin-sdk/provider-http` | Utilitaires HTTP de fournisseur | Utilitaires génériques de capacité HTTP/point de terminaison de fournisseur, y compris les utilitaires de formulaire multipart de transcription audio |
  | `plugin-sdk/provider-web-fetch` | Utilitaires web-fetch de fournisseur | Utilitaires d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilitaires de configuration web-search de fournisseur | Utilitaires ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de plugin |
  | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat web-search de fournisseur | Utilitaires ciblés de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les setters/getters d’identifiants limités à un périmètre |
  | `plugin-sdk/provider-web-search` | Utilitaires web-search de fournisseur | Utilitaires d’enregistrement/cache/exécution de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Utilitaires de compatibilité d’outils/schémas de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage + diagnostics des schémas DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Utilitaires d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres utilitaires d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Utilitaires d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux et utilitaires partagés d’enveloppe Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport de fournisseur | Utilitaires de transport natif de fournisseur tels que fetch protégé, extraction de texte de résultat d’outil, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File d’attente asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilitaires multimédias partagés | Utilitaires de récupération/transformation/stockage de médias, sondage des dimensions vidéo basé sur ffprobe et constructeurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Utilitaires partagés de génération multimédia | Utilitaires partagés de bascule, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Utilitaires de compréhension multimédia | Types de fournisseurs de compréhension multimédia et exports d’utilitaires image/audio côté fournisseur |
  | `plugin-sdk/text-runtime` | Export de compatibilité textuelle large déprécié | Utiliser `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Utilitaires de découpage de texte | Utilitaire de découpage de texte sortant |
  | `plugin-sdk/speech` | Utilitaires vocaux | Types de fournisseurs vocaux et utilitaires côté fournisseur pour directives, registre, validation, ainsi que constructeur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Utilitaires de transcription en temps réel | Types de fournisseurs, utilitaires de registre et utilitaire partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Utilitaires vocaux en temps réel | Types de fournisseurs, utilitaires de registre/résolution, utilitaires de session de pont, files partagées de réponse vocale d’agent, contrôle vocal d’exécution active, santé de transcription/événement, suppression d’écho, correspondance des questions de consultation, coordination de consultation forcée, suivi du contexte de tour, suivi d’activité de sortie et utilitaires de consultation rapide de contexte |
  | `plugin-sdk/image-generation` | Utilitaires de génération d’images | Types de fournisseurs de génération d’images, utilitaires d’URL de données/ressources image et constructeur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, bascule, authentification et utilitaires de registre |
  | `plugin-sdk/music-generation` | Utilitaires de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, utilitaires de bascule, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Utilitaires de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, utilitaires de bascule, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Utilitaires de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Utilitaires d’écriture de configuration de canal | Utilitaires d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports partagés de préambule de plugin de canal |
  | `plugin-sdk/channel-status` | Utilitaires d’état de canal | Utilitaires partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilitaires de configuration de liste d’autorisation | Utilitaires de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Utilitaires d’accès de groupe | Utilitaires partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité dépréciées | Utiliser `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Utilitaires de garde de DM direct | Utilitaires ciblés de politique de garde pré-crypto |
  | `plugin-sdk/extension-shared` | Utilitaires d’extension partagés | Primitives de canal passif/d’état et d’assistant de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Utilitaires de cibles Webhook | Registre de cibles Webhook et utilitaires d’installation de route |
  | `plugin-sdk/webhook-path` | Alias déprécié de chemin Webhook | Utiliser `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Utilitaires multimédias web partagés | Utilitaires de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport de compatibilité Zod déprécié | Importer `zod` depuis `zod` directement |
  | `plugin-sdk/memory-core` | Utilitaires memory-core intégrés | Surface d’utilitaires de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’index/recherche de mémoire |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registre d’embeddings de mémoire | Utilitaires légers de registre de fournisseurs d’embeddings de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte de mémoire | Exports du moteur de fondation de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte de mémoire | Contrats d’embeddings de mémoire, accès au registre, fournisseur local et utilitaires génériques de traitement par lot/distants ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte de mémoire | Exports du moteur QMD de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte de mémoire | Exports du moteur de stockage de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Utilitaires multimodaux de l’hôte de mémoire | Utilitaires multimodaux de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Utilitaires de requête de l’hôte de mémoire | Utilitaires de requête de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Utilitaires de secret de l’hôte de mémoire | Utilitaires de secret de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias déprécié d’événement de mémoire | Utiliser `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Utilitaires d’état de l’hôte de mémoire | Utilitaires d’état de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte de mémoire | Utilitaires d’exécution CLI de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution du noyau de l’hôte de mémoire | Utilitaires d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilitaires de fichier/exécution de l’hôte de mémoire | Utilitaires de fichier/exécution de l’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution du noyau de l’hôte de mémoire | Alias indépendant du fournisseur pour les utilitaires d’exécution du noyau de l’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte de mémoire | Alias indépendant du fournisseur pour les utilitaires de journal d’événements de l’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias déprécié de fichier/exécution de mémoire | Utiliser `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Utilitaires Markdown gérés | Utilitaires partagés de Markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution différée du gestionnaire de recherche active-memory |
  | `plugin-sdk/memory-host-status` | Alias déprécié d’état de l’hôte de mémoire | Utiliser `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Barrel de compatibilité déprécié local au dépôt ; utiliser des sous-chemins de test ciblés locaux au dépôt tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau est volontairement le sous-ensemble commun de migration, et non la
surface complète du SDK. L’inventaire des points d’entrée du compilateur se
trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ; les exports de paquet
sont générés à partir du sous-ensemble public.

Les points de jonction d’assistance réservés aux plugins groupés ont été
retirés de la carte d’export public du SDK, sauf pour les façades de
compatibilité explicitement documentées, comme le shim déprécié
`plugin-sdk/discord` conservé pour le paquet publié
`@openclaw/discord@2026.3.13`. Les assistants propres à un propriétaire
résident dans le paquet du plugin propriétaire ; le comportement partagé de
l’hôte doit passer par des contrats SDK génériques comme
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
`plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus étroit qui correspond à la tâche. Si vous ne trouvez
pas d’export, vérifiez la source dans `src/plugin-sdk/` ou demandez aux
mainteneurs quel contrat générique doit en être propriétaire.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent au SDK de plugin, au contrat de
fournisseur, à la surface d’exécution et au manifeste. Chacune fonctionne encore
aujourd’hui, mais sera supprimée dans une future version majeure. L’entrée sous
chaque élément associe l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures,
    mêmes exports - simplement importés depuis le sous-chemin plus étroit.
    `command-auth` les réexporte comme stubs de compatibilité.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` - renvoie
    un seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les
    anciens plugins de canal. Ne l’importez pas depuis du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les assistants `channelActions*` dans `openclaw/plugin-sdk/channel-actions`
    sont dépréciés avec les exports de canal "actions" bruts. Exposez plutôt les
    capacités via la surface sémantique `presentation` - les plugins de canal
    déclarent ce qu’ils affichent (cartes, boutons, sélecteurs) plutôt que les
    noms d’action bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin
    fournisseur. OpenClaw n’a plus besoin de l’assistant SDK pour enregistrer
    l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe
    d’invite en texte brut plat à partir des messages de canal entrants.

    **Nouveau** : `BodyForAgent` avec des blocs structurés de contexte
    utilisateur. Les plugins de canal attachent les métadonnées de routage
    (fil, sujet, réponse à, réactions) comme champs typés au lieu de les
    concaténer dans une chaîne d’invite. L’assistant `formatAgentEnvelope(...)`
    reste pris en charge pour les enveloppes synthétisées destinées à
    l’assistant, mais les enveloppes entrantes en texte brut sont en cours de
    retrait.

    Zones concernées : `inbound_claim`, `message_received` et tout plugin de
    canal personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Ancien** : `api.on("deactivate", handler)`.

    **Nouveau** : `api.on("gateway_stop", handler)`. L’événement et le contexte
    constituent le même contrat de nettoyage à l’arrêt ; seul le nom du hook
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

    `deactivate` reste câblé comme alias de compatibilité déprécié jusqu’après
    le 2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Ancien** : `api.on("subagent_spawning", handler)` renvoyant
    `threadBindingReady` ou `deliveryOrigin`.

    **Nouveau** : laissez le cœur préparer les liaisons de sous-agent
    `thread: true` via l’adaptateur de liaison de session du canal. Utilisez
    `api.on("subagent_spawned", handler)` uniquement pour l’observation après
    lancement.

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
    surfaces de compatibilité dépréciées pendant la migration des plugins
    externes.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Quatre alias de type de découverte sont maintenant de fines enveloppes
    autour des types de l’ère catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus l’ancien sac statique `ProviderCapabilities` - les plugins
    fournisseurs doivent utiliser des hooks de fournisseur explicites comme
    `buildReplayPolicy`, `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un
    objet statique.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un seul `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et
    la liste de niveaux classés. OpenClaw rétrograde automatiquement les valeurs
    stockées obsolètes selon le rang du profil.

    Le contexte inclut `provider`, `modelId`, `reasoning` fusionné facultatif
    et les faits `compat` de modèle fusionnés facultatifs. Les plugins
    fournisseurs peuvent utiliser ces faits de catalogue pour exposer un profil
    propre au modèle uniquement lorsque le contrat de requête configuré le prend
    en charge.

    Implémentez un hook au lieu de trois. Les anciens hooks continuent de
    fonctionner pendant la fenêtre de dépréciation, mais ne sont pas composés
    avec le résultat du profil.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
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

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : reflétez la même recherche de variable d’environnement dans
    `setup.providers[].envVars` sur le manifeste. Cela consolide les
    métadonnées d’environnement de configuration/statut en un seul endroit et
    évite de démarrer l’environnement d’exécution du plugin uniquement pour
    répondre aux recherches de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de
    compatibilité jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Ancien** : trois appels séparés -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API d’état mémoire -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les assistants additifs
    de prompt et de corpus (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) ne sont pas affectés.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Ancien** : `api.registerMemoryEmbeddingProvider(...)` avec
    `contracts.memoryEmbeddingProviders`.

    **Nouveau** : `api.registerEmbeddingProvider(...)` avec
    `contracts.embeddingProviders`.

    Le contrat générique de fournisseur d’embeddings est réutilisable en dehors
    de la mémoire et constitue le chemin pris en charge pour les nouveaux
    fournisseurs. L’API d’enregistrement propre à la mémoire reste câblée comme
    compatibilité dépréciée pendant la migration des fournisseurs existants.
    L’inspection des plugins signale l’usage non groupé comme dette de
    compatibilité.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Deux alias de type hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                        | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode d’exécution `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode délègue à la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur de
    flux de tâches actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’environnement
    d’exécution de mutation TaskFlow gérée pour les plugins qui créent, mettent
    à jour, annulent ou exécutent des tâches enfant depuis un flux. Utilisez
    `runtime.tasks.flows` lorsque le plugin n’a besoin que de lectures basées
    sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Couvert dans "Comment migrer → Migrer les extensions de résultats d’outils
    intégrées vers le middleware" ci-dessus. Inclus ici par souci d’exhaustivité :
    le chemin supprimé réservé à l’exécuteur intégré
    `api.registerEmbeddedExtensionFactory(...)` est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste explicite
    d’environnements d’exécution dans `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est maintenant
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
Les dépréciations au niveau des extensions (dans les plugins groupés de canal
ou de fournisseur sous `extensions/`) sont suivies dans leurs propres barrels
`api.ts` et `runtime-api.ts`. Elles n’affectent pas les contrats de plugins
tiers et ne sont pas listées ici. Si vous consommez directement le barrel local
d’un plugin groupé, lisez les commentaires de dépréciation dans ce barrel avant
la mise à niveau.
</Note>

## Calendrier de suppression

| Quand                         | Ce qui se passe                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Maintenant**                | Les surfaces dépréciées émettent des avertissements d’exécution                 |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Suppression temporaire des avertissements

Définissez ces variables d’environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une solution de contournement temporaire, pas d’une solution permanente.

## Associé

- [Bien démarrer](/fr/plugins/building-plugins) - créez votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Plugins de canaux](/fr/plugins/sdk-channel-plugins) - création de plugins de canaux
- [Plugins de fournisseurs](/fr/plugins/sdk-provider-plugins) - création de plugins de fournisseurs
- [Internes des plugins](/fr/plugins/architecture) - analyse approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) - référence du schéma de manifeste
