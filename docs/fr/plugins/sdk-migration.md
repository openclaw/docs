---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez api.registerEmbeddedExtensionFactory avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture moderne des Plugins
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugins
moderne avec des imports ciblés et documentés. Si votre plugin a été conçu avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer
tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** - un import unique qui réexportait des dizaines d’aides.
  Il a été introduit pour maintenir le fonctionnement des anciens plugins basés sur des hooks pendant que la
  nouvelle architecture de plugins était en cours de construction.
- **`openclaw/plugin-sdk/infra-runtime`** - un large barrel d’aides d’exécution qui
  mélangeait événements système, état Heartbeat, files de livraison, aides fetch/proxy,
  aides de fichiers, types d’approbation et utilitaires sans rapport.
- **`openclaw/plugin-sdk/config-runtime`** - un large barrel de compatibilité de configuration
  qui conserve encore des aides directes de chargement/écriture dépréciées pendant la fenêtre
  de migration.
- **`openclaw/extension-api`** - une passerelle qui donnait aux plugins un accès direct à
  des aides côté hôte comme le runner d’agent intégré.
- **`api.registerEmbeddedExtensionFactory(...)`** - un hook d’extension intégrée réservé à Pi et supprimé
  qui pouvait observer les événements du runner intégré tels que
  `tool_result`.

Les larges surfaces d’import sont désormais **dépréciées**. Elles fonctionnent encore à l’exécution,
mais les nouveaux plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant
que la prochaine version majeure ne les supprime. L’API d’enregistrement de factory d’extension intégrée
réservée à Pi a été supprimée ; utilisez plutôt le middleware de résultat d’outil.

OpenClaw ne supprime pas et ne réinterprète pas un comportement de plugin documenté dans le même
changement qui introduit un remplacement. Les changements de contrat cassants doivent d’abord passer
par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports SDK, aux champs de manifeste, aux API de configuration, aux hooks et au
comportement d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
  Les enregistrements de factory d’extension intégrée réservés à Pi ne se chargent déjà plus.
</Warning>

## Pourquoi ce changement

L’ancienne approche posait des problèmes :

- **Démarrage lent** - importer une aide chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** - les réexportations larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** - aucun moyen de distinguer les exports stables des exports internes

Le SDK de plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les anciennes interfaces de commodité fournisseur pour les canaux inclus ont également disparu.
Les interfaces d’aide marquées par canal étaient des raccourcis privés de mono-repo, pas des
contrats de plugin stables. Utilisez plutôt des sous-chemins SDK génériques étroits. Dans l’espace de travail
des plugins inclus, conservez les aides appartenant au fournisseur dans le `api.ts` ou
`runtime-api.ts` propre à ce plugin.

Exemples actuels de fournisseurs inclus :

- Anthropic conserve les aides de flux spécifiques à Claude dans sa propre interface `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les aides de modèle par défaut et les builders de fournisseur
  temps réel dans son propre `api.ts`
- OpenRouter conserve les aides de builder de fournisseur et d’onboarding/configuration dans son propre
  `api.ts`

## Plan de migration Talk et voix temps réel

Le code de voix temps réel, téléphonie, réunion et Talk dans le navigateur passe d’une tenue de comptabilité
des tours locale à la surface vers un contrôleur de session Talk partagé exporté par
`openclaw/plugin-sdk/realtime-voice`. Le nouveau contrôleur possède l’enveloppe d’événements Talk
commune, l’état de tour actif, l’état de capture, l’état d’audio de sortie, l’historique récent
des événements et le rejet des tours obsolètes. Les plugins fournisseurs doivent continuer à posséder
les sessions temps réel propres au vendeur ; les plugins de surface doivent continuer à posséder la capture,
la lecture, la téléphonie et les particularités de réunion.

Cette migration Talk est volontairement cassante et propre :

1. Conserver les primitives partagées de contrôleur/runtime dans
   `plugin-sdk/realtime-voice`.
2. Migrer les surfaces incluses vers le contrôleur partagé : relais navigateur,
   handoff de salle gérée, temps réel d’appel vocal, STT en streaming d’appel vocal, temps réel Google
   Meet et push-to-talk natif.
3. Remplacer les anciennes familles RPC Talk par l’API finale `talk.session.*` et
   `talk.client.*`.
4. Annoncer un canal d’événements Talk en direct unique dans
   `hello-ok.features.events` du Gateway : `talk.event`.
5. Supprimer l’ancien endpoint HTTP temps réel et tout chemin de surcharge d’instructions
   au moment de la requête.

Le nouveau code ne doit pas appeler `createTalkEventSequencer(...)` directement sauf s’il
implémente un adaptateur de bas niveau ou une fixture de test. Préférez le contrôleur partagé
afin que les événements bornés au tour ne puissent pas être émis sans id de tour, que les appels
`turnEnd` / `turnCancel` obsolètes ne puissent pas effacer un tour actif plus récent, et que les événements
de cycle de vie d’audio de sortie restent cohérents entre la téléphonie, les réunions, le relais navigateur,
le handoff de salle gérée et les clients Talk natifs.

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
```

Les sessions WebRTC/websocket fournisseur possédées par le navigateur utilisent `talk.client.create`,
car le navigateur possède la négociation fournisseur et le transport média tandis que le
Gateway possède les identifiants, les instructions et la politique d’outils. `talk.session.*` est la
surface commune gérée par le Gateway pour les sessions temps réel gateway-relay, de
transcription gateway-relay et STT/TTS natives de salle gérée.

Les configurations héritées qui plaçaient les sélecteurs temps réel à côté de `talk.provider` /
`talk.providers` doivent être réparées avec `openclaw doctor --fix` ; Talk à l’exécution
ne réinterprète pas la configuration de fournisseur speech/TTS comme une configuration de fournisseur temps réel.

Les combinaisons `talk.session.create` prises en charge sont volontairement limitées :

| Mode            | Transport       | Cerveau         | Propriétaire        | Notes                                                                                                              |
| --------------- | --------------- | --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway             | Audio fournisseur full-duplex relayé via le Gateway ; les appels d’outils sont routés via l’outil agent-consult.   |
| `transcription` | `gateway-relay` | `none`          | Gateway             | STT en streaming uniquement ; les appelants envoient l’audio d’entrée et reçoivent des événements de transcription. |
| `stt-tts`       | `managed-room`  | `agent-consult` | Salle native/client | Salles de style push-to-talk et talkie-walkie où le client possède la capture/lecture et le Gateway possède l’état de tour. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Salle native/client | Mode de salle réservé aux administrateurs pour les surfaces first-party fiables qui exécutent directement des actions d’outil du Gateway. |

Carte des méthodes supprimées :

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

Le vocabulaire de contrôle unifié est également délibérément étroit :

| Méthode                         | S’applique à                                            | Contrat                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Ajouter un fragment audio PCM en base64 à la session fournisseur possédée par la même connexion Gateway.                                                                                 |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Démarrer un tour utilisateur de salle gérée.                                                                                                                                             |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Terminer le tour actif après validation des tours obsolètes.                                                                                                                            |
| `talk.session.cancelTurn`       | toutes les sessions possédées par le Gateway            | Annuler le travail actif de capture/fournisseur/agent/TTS pour un tour.                                                                                                                  |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Arrêter la sortie audio de l’assistant sans nécessairement terminer le tour utilisateur.                                                                                                 |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Terminer un appel d’outil fournisseur émis par le relais ; passer `options.willContinue` pour une sortie intermédiaire ou `options.suppressResponse` pour satisfaire l’appel sans autre réponse de l’assistant. |
| `talk.session.close`            | toutes les sessions unifiées                            | Arrêter les sessions de relais ou révoquer l’état de salle gérée, puis oublier l’id de session unifiée.                                                                                 |

  N’introduisez pas de cas particuliers de fournisseur ou de plateforme dans le noyau pour que cela fonctionne.
  Le noyau possède la sémantique des sessions Talk. Les plugins de fournisseur possèdent la configuration des sessions de fournisseur.
  Les appels vocaux et Google Meet possèdent les adaptateurs de téléphonie/réunion. Le navigateur et les applications natives
  possèdent l’expérience utilisateur de capture/lecture de l’appareil.

  ## Politique de compatibilité

  Pour les plugins externes, le travail de compatibilité suit cet ordre :

  1. ajouter le nouveau contrat
  2. conserver l’ancien comportement raccordé via un adaptateur de compatibilité
  3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
  4. couvrir les deux chemins dans les tests
  5. documenter l’obsolescence et le chemin de migration
  6. supprimer uniquement après la fenêtre de migration annoncée, généralement dans une version majeure

  Les mainteneurs peuvent auditer la file de migration actuelle avec
  `pnpm plugins:boundary-report`. Utilisez `pnpm plugins:boundary-report:summary` pour des
  décomptes compacts, `--owner <id>` pour un plugin ou un propriétaire de compatibilité, et
  `pnpm plugins:boundary-report:ci` lorsqu’une barrière CI doit échouer sur des enregistrements
  de compatibilité arrivés à échéance, des imports SDK réservés inter-propriétaires, ou des
  sous-chemins SDK réservés inutilisés. Le rapport regroupe les enregistrements de
  compatibilité obsolètes par date de suppression, compte les références locales dans le code/la documentation,
  fait remonter les imports SDK réservés inter-propriétaires, et résume le pont SDK privé
  de l’hôte mémoire afin que le nettoyage de compatibilité reste explicite au lieu de
  s’appuyer sur des recherches ad hoc. Les sous-chemins SDK réservés doivent avoir une utilisation propriétaire suivie ;
  les exports d’assistants réservés inutilisés doivent être supprimés du SDK public.

  Si un champ de manifeste est encore accepté, les auteurs de plugins peuvent continuer à l’utiliser jusqu’à ce que
  la documentation et les diagnostics indiquent le contraire. Le nouveau code doit privilégier le remplacement
  documenté, mais les plugins existants ne doivent pas casser pendant les versions mineures ordinaires.

  ## Comment migrer

  <Steps>
  <Step title="Migrer les assistants de chargement/écriture de configuration runtime">
    Les plugins intégrés doivent arrêter d’appeler
    `api.runtime.config.loadConfig()` et
    `api.runtime.config.writeConfigFile(...)` directement. Préférez la configuration qui a
    déjà été transmise au chemin d’appel actif. Les gestionnaires de longue durée qui ont besoin de
    l’instantané du processus actuel peuvent utiliser `api.runtime.config.current()`. Les outils
    d’agent de longue durée doivent utiliser `ctx.getRuntimeConfig()` du contexte d’outil dans
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
    que le changement nécessite un redémarrage propre du gateway, et
    `afterWrite: { mode: "none", reason: "..." }` uniquement lorsque l’appelant possède le
    suivi et veut délibérément supprimer le planificateur de rechargement.
    Les résultats de mutation incluent un résumé `followUp` typé pour les tests et la journalisation ;
    le gateway reste responsable de l’application ou de la planification du redémarrage.
    `loadConfig` et `writeConfigFile` restent des assistants de compatibilité obsolètes
    pour les plugins externes pendant la fenêtre de migration et avertissent une fois avec
    le code de compatibilité `runtime-config-load-write`. Les plugins intégrés et le code
    runtime du dépôt sont protégés par des garde-fous de scanner dans
    `pnpm check:deprecated-api-usage` et
    `pnpm check:no-runtime-action-load-config` : toute nouvelle utilisation dans un plugin de production
    échoue immédiatement, les écritures directes de configuration échouent, les méthodes du serveur gateway doivent utiliser
    l’instantané runtime de la requête, les assistants runtime de canal d’envoi/action/client
    doivent recevoir la configuration depuis leur frontière, et les modules runtime de longue durée ont
    zéro appel ambiant `loadConfig()` autorisé.

    Le nouveau code de plugin doit aussi éviter d’importer le barrel large de compatibilité
    `openclaw/plugin-sdk/config-runtime`. Utilisez le sous-chemin SDK étroit qui correspond à la tâche :

    | Besoin | Import |
    | --- | --- |
    | Types de configuration tels que `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions de configuration déjà chargée et recherche de configuration d’entrée de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lectures de l’instantané runtime actuel | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Écritures de configuration | `openclaw/plugin-sdk/config-mutation` |
    | Assistants de stockage de session | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuration de table Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Assistants runtime de politique de groupe | `openclaw/plugin-sdk/runtime-group-policy` |
    | Résolution des entrées secrètes | `openclaw/plugin-sdk/secret-input-runtime` |
    | Remplacements de modèle/session | `openclaw/plugin-sdk/model-session-runtime` |

    Les plugins intégrés et leurs tests sont protégés par scanner contre le barrel large
    afin que les imports et les mocks restent locaux au comportement dont ils ont besoin. Le barrel large
    existe toujours pour la compatibilité externe, mais le nouveau code ne doit pas
    en dépendre.

  </Step>

  <Step title="Migrer les extensions de résultat d’outil Pi vers un middleware">
    Les plugins intégrés doivent remplacer les gestionnaires de résultat d’outil propres à Pi
    `api.registerEmbeddedExtensionFactory(...)` par un middleware neutre vis-à-vis du runtime.

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

    Les plugins externes ne peuvent pas enregistrer de middleware de résultat d’outil, car il peut
    réécrire une sortie d’outil hautement fiable avant que le modèle ne la voie.

  </Step>

  <Step title="Migrer les gestionnaires natifs d’approbation vers des faits de capacité">
    Les plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre de contexte runtime partagé.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison propres à l’approbation hors du câblage hérité `plugin.auth` /
      `plugin.approvals` et vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion de canal ; les hooks d’authentification
      d’approbation qui s’y trouvent ne sont plus lus par le noyau
    - Enregistrez les objets runtime possédés par le canal, tels que les clients, les jetons ou les applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage possédés par le plugin depuis des gestionnaires d’approbation natifs ;
      le noyau possède désormais les avis routés ailleurs à partir des résultats de livraison réels
    - Lorsque vous passez `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais fermés, sauf si vous passez explicitement
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

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre plugin les imports provenant de l’une ou l’autre surface obsolète :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
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

    Pour les assistants côté hôte, utilisez le runtime de plugin injecté au lieu d’importer
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
    | assistants de stockage de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Remplacer les imports infra-runtime larges">
    `openclaw/plugin-sdk/infra-runtime` existe toujours pour la compatibilité
    externe, mais le nouveau code doit importer la surface d’assistant ciblée dont il a
    réellement besoin :

    | Besoin | Import |
    | --- | --- |
    | Assistants de file d’événements système | `openclaw/plugin-sdk/system-event-runtime` |
    | Assistants de réveil, d’événement et de visibilité Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Vidage de la file de livraisons en attente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Télémétrie d’activité de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de déduplication en mémoire | `openclaw/plugin-sdk/dedupe-runtime` |
    | Assistants de chemins de fichier local/média sûrs | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch tenant compte du dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Assistants de proxy et de fetch protégé | `openclaw/plugin-sdk/fetch-runtime` |
    | Types de politique de dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Types de demande/résolution d’approbation | `openclaw/plugin-sdk/approval-runtime` |
    | Assistants de charge utile de réponse d’approbation et de commande | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Assistants de formatage d’erreur | `openclaw/plugin-sdk/error-runtime` |
    | Attentes de disponibilité du transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Assistants de jeton sécurisé | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concurrence bornée des tâches asynchrones | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercition numérique | `openclaw/plugin-sdk/number-runtime` |
    | Verrou asynchrone local au processus | `openclaw/plugin-sdk/async-lock-runtime` |
    | Verrous de fichiers | `openclaw/plugin-sdk/file-lock` |

    Les plugins intégrés sont protégés par scanner contre `infra-runtime`, donc le code du dépôt
    ne peut pas régresser vers le barrel large.

  </Step>

  <Step title="Migrer les assistants de route de canal">
    Le nouveau code de route de canal doit utiliser `openclaw/plugin-sdk/channel-route`.
    Les anciens noms de clé de route et de cible comparable restent des alias de compatibilité
    pendant la fenêtre de migration, mais les nouveaux plugins doivent utiliser les noms de route
    qui décrivent directement le comportement :

    | Ancien utilitaire | Utilitaire moderne |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Les utilitaires de routage modernes normalisent `{ channel, to, accountId, threadId }`
    de manière cohérente entre les approbations natives, la suppression des réponses, la déduplication entrante,
    la livraison cron et le routage de session. Si votre plugin possède sa propre
    grammaire de cible personnalisée, utilisez `resolveChannelRouteTargetWithParser(...)` pour adapter ce
    parseur au même contrat de cible de routage.

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Tableau des chemins d’import courants">
  | Chemin d’import | Objectif | Exports principaux |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant d’entrée de Plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexport ombrelle hérité pour les définitions/générateurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et générateurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration | Invites de liste d’autorisation, générateurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants d’exécution pendant la configuration | Adaptateurs de correctifs de configuration sûrs à l’import, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Alias d’adaptateur de configuration obsolète | Utilisez `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multi-comptes | Assistants de liste/configuration/porte d’action de compte |
  | `plugin-sdk/account-id` | Assistants d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation des identifiants de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte ciblés | Assistants de liste de comptes/d’action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’association de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse, de la saisie et de la livraison source | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration et assistants d’accès DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Générateurs de schémas de configuration | Primitives de schéma de configuration de canal partagées et générateur générique uniquement |
  | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration groupés | Plugins groupés maintenus par OpenClaw uniquement ; les nouveaux Plugins doivent définir des schémas locaux au Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schémas de configuration groupés obsolètes | Alias de compatibilité uniquement ; utilisez `plugin-sdk/bundled-channel-config-schema` pour les Plugins groupés maintenus |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation des noms de commande, suppression des espaces des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants d’état de compte et de cycle de vie du flux de brouillons | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + générateur d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/de correspondance des cibles |
  | `plugin-sdk/outbound-media` | Assistants de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Assistants de dépendances d’envoi sortant | Recherche légère `resolveOutboundSendDep` sans importer l’exécution sortante complète |
  | `plugin-sdk/outbound-runtime` | Assistants d’exécution sortante | Assistants de livraison sortante, délégué d’identité/envoi, session, formatage et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fils | Assistants de cycle de vie et d’adaptateur de liaison de fils |
  | `plugin-sdk/agent-media-payload` | Assistants hérités de charge utile média | Générateur de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants d’exécution larges | Assistants d’exécution/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Assistants d’environnement d’exécution ciblés | Environnement de journalisation/exécution, délai d’expiration, nouvelle tentative et assistants de backoff |
  | `plugin-sdk/plugin-runtime` | Assistants partagés d’exécution de Plugin | Assistants de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hooks | Assistants partagés de pipeline de hooks Webhook/internes |
  | `plugin-sdk/lazy-runtime` | Assistants d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants d’exécution partagés |
  | `plugin-sdk/cli-runtime` | Assistants d’exécution CLI | Formatage des commandes, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway, assistant de démarrage prêt pour la boucle d’événements et assistants de correctifs d’état de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilité de configuration obsolète | Préférez `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation de commandes Telegram stables au repli lorsque la surface de contrat Telegram groupée est indisponible |
  | `plugin-sdk/approval-runtime` | Assistants d’invite d’approbation | Charge utile d’approbation d’exécution/Plugin, assistants de capacité/profil d’approbation, assistants de routage/exécution d’approbation native et formatage structuré du chemin d’affichage d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’authentification d’approbation | Résolution de l’approbateur, authentification d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Assistants de client d’approbation | Assistants natifs de profil/filtre d’approbation d’exécution |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution de Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal chauds |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants d’exécution plus larges de gestionnaire d’approbation ; préférez les coutures d’adaptateur/Gateway plus ciblées lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation d’exécution/Plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte d’exécution de canal | Assistants génériques d’enregistrement/obtention/surveillance de contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, contrôle DM, fichiers/chemins bornés à la racine, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF | Assistants de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants d’exécution SSRF | Dispatcher épinglé, récupération protégée, assistants de politique SSRF |
  | `plugin-sdk/system-event-runtime` | Assistants d’événements système | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Assistants Heartbeat | Assistants de réveil, d’événement et de visibilité Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Assistants de file de livraison | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Assistants d’activité de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Assistants de déduplication | Caches de déduplication en mémoire |
  | `plugin-sdk/file-access-runtime` | Assistants d’accès aux fichiers | Assistants de chemins sûrs de fichier/média local |
  | `plugin-sdk/transport-ready-runtime` | Assistants de préparation du transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de contrôle des diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de formatage des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants de récupération/proxy encapsulés | `resolveFetch`, assistants de proxy, assistants d’options EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politiques |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage des entrées de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Contrôle des commandes et assistants de surface de commande | `resolveControlCommandGate`, assistants d’autorisation d’expéditeur, assistants de registre de commandes incluant le formatage de menus d’arguments dynamiques |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Assistants d’entrées secrètes |
  | `plugin-sdk/webhook-ingress` | Assistants de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde du corps Webhook | Assistants de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Répartition entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de répartition des réponses | Finalisation, répartition fournisseur et assistants d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique de réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage des réponses | Assistants de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de magasin de sessions | Assistants de chemin de magasin + date de mise à jour |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Générateurs de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolution de cible | Assistants partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaînes | Assistants de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL sous forme de chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commandes chronométrées | Exécuteur de commandes chronométrées avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs courants de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemins temporaires | Assistants partagés pour les chemins de téléchargement temporaires |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Assistants pour le journal du sous-système et la censure |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableaux Markdown | Assistants pour le mode tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse aux messages | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Assistants de configuration de fournisseurs locaux/auto-hébergés sélectionnés | Assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI | Les mêmes assistants de découverte/configuration de fournisseurs auto-hébergés |
  | `plugin-sdk/provider-auth-runtime` | Assistants d’authentification d’exécution des fournisseurs | Assistants de résolution de clé d’API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clé d’API de fournisseur | Assistants d’intégration/écriture de profil pour les clés d’API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’authentification de fournisseur | Générateur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-selection-runtime` | Assistants de sélection de fournisseur | Sélection de fournisseur configurée ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement de fournisseur | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, assistants de points de terminaison de fournisseur et assistants de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’intégration de fournisseur | Assistants de configuration d’intégration |
  | `plugin-sdk/provider-http` | Assistants HTTP de fournisseur | Assistants génériques de capacités HTTP/point de terminaison de fournisseur, y compris les assistants de formulaire multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants web-fetch de fournisseur | Assistants d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration web-search de fournisseur | Assistants ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin de câblage d’activation de plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat web-search de fournisseur | Assistants ciblés de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les accesseurs/définisseurs d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Assistants web-search de fournisseur | Assistants d’enregistrement/cache/exécution de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, et nettoyage + diagnostics de schéma Gemini |
  | `plugin-sdk/provider-usage` | Assistants d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres assistants d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’encapsulation de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’encapsuleurs de flux, et assistants partagés d’encapsulation Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur | Assistants de transport natif de fournisseur tels que la récupération protégée, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants média partagés | Assistants de récupération/transformation/stockage de média, détection des dimensions vidéo basée sur ffprobe et générateurs de charges utiles média |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération de média | Assistants partagés de bascule, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension média | Types de fournisseurs de compréhension média ainsi qu’exports d’assistants image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Export de compatibilité de texte large obsolète | Utiliser `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` et `logging-core` |
  | `plugin-sdk/text-chunking` | Assistants de découpage de texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants vocaux | Types de fournisseurs vocaux ainsi qu’assistants destinés aux fournisseurs pour les directives, le registre, la validation et générateur TTS compatible OpenAI |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseurs vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription en temps réel | Types de fournisseurs, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants vocaux en temps réel | Types de fournisseurs, assistants de registre/résolution, assistants de session de passerelle, files partagées de réponse vocale d’agent, santé des transcriptions/événements, suppression d’écho et assistants de consultation rapide du contexte |
  | `plugin-sdk/image-generation` | Assistants de génération d’images | Types de fournisseurs de génération d’images ainsi qu’assistants d’URL de données/ressources d’image et générateur de fournisseur d’images compatible OpenAI |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, bascule, authentification et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération de musique | Types de fournisseur/requête/résultat de génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, assistants de bascule, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération de vidéos | Types de fournisseur/requête/résultat de génération de vidéos |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération de vidéos | Types de génération de vidéos, assistants de bascule, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule de canal partagé | Exports partagés de préambule de Plugin de canal |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants de modification/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de MP direct | Assistants partagés d’authentification/protection de MP direct |
  | `plugin-sdk/extension-shared` | Assistants d’extension partagés | Primitives d’assistants de canal passif/état et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cibles Webhook | Registre de cibles Webhook et assistants d’installation de routes |
  | `plugin-sdk/webhook-path` | Alias de chemin Webhook obsolète | Utiliser `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Assistants média web partagés | Assistants de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexport de compatibilité Zod obsolète | Importer `zod` depuis `zod` directement |
  | `plugin-sdk/memory-core` | Assistants memory-core intégrés | Surface d’assistants gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur de mémoire | Façade d’exécution d’indexation/recherche de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de base d’hôte de mémoire | Exports du moteur de base d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings d’hôte de mémoire | Contrats d’embedding de mémoire, accès au registre, fournisseur local et assistants génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD d’hôte de mémoire | Exports du moteur QMD d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage d’hôte de mémoire | Exports du moteur de stockage d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux d’hôte de mémoire | Assistants multimodaux d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête d’hôte de mémoire | Assistants de requête d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret d’hôte de mémoire | Assistants de secret d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Alias d’événement de mémoire obsolète | Utiliser `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état d’hôte de mémoire | Assistants d’état d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI d’hôte de mémoire | Assistants d’exécution CLI d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution de cœur d’hôte de mémoire | Assistants d’exécution de cœur d’hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers/exécution d’hôte de mémoire | Assistants de fichiers/exécution d’hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution de cœur d’hôte de mémoire | Alias neutre vis-à-vis des fournisseurs pour les assistants d’exécution de cœur d’hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements d’hôte de mémoire | Alias neutre vis-à-vis des fournisseurs pour les assistants de journal d’événements d’hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichiers/exécution de mémoire obsolète | Utiliser `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Assistants Markdown gérés | Assistants Markdown gérés partagés pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état d’hôte de mémoire obsolète | Utiliser `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitaires de test | Barillet de compatibilité obsolète local au dépôt ; utiliser des sous-chemins de test ciblés locaux au dépôt tels que `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` et `plugin-sdk/test-fixtures` |
</Accordion>

Ce tableau correspond volontairement au sous-ensemble commun de migration, et non à la surface complète du SDK. L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de paquet sont générés à partir du sous-ensemble public.

Les points de jonction d’aide réservés aux plugins groupés ont été retirés de la carte d’exports du SDK public, à l’exception des façades de compatibilité explicitement documentées, comme le shim déprécié `plugin-sdk/discord` conservé pour le paquet publié
`@openclaw/discord@2026.3.13`. Les aides propres à un propriétaire résident dans le paquet du plugin propriétaire ; le comportement partagé de l’hôte doit passer par des contrats SDK génériques tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

Utilisez l’import le plus restreint qui correspond à la tâche. Si vous ne trouvez pas d’export, consultez la source dans `src/plugin-sdk/` ou demandez aux mainteneurs quel contrat générique doit en être responsable.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent au SDK de plugins, au contrat de fournisseur, à la surface d’exécution et au manifeste. Chacune fonctionne encore aujourd’hui, mais sera supprimée dans une future version majeure. L’entrée sous chaque élément associe l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="Constructeurs d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports - seulement importés depuis le sous-chemin plus restreint. `command-auth`
    les réexporte comme stubs de compatibilité.

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

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` - renvoie un
    objet de décision unique au lieu de deux appels séparés.

    Les plugins de canaux en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    basculé.

  </Accordion>

  <Accordion title="Shim d’exécution de canal et aides d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    plugins de canaux. Ne l’importez pas depuis du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets
    d’exécution.

    Les aides `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    dépréciées en même temps que les exports bruts d’« actions » de canal. Exposez plutôt les capacités
    via la surface sémantique `presentation` - les plugins de canaux
    déclarent ce qu’ils affichent (cartes, boutons, sélecteurs) plutôt que les noms
    d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="Aide tool() du fournisseur de recherche web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémentez `createTool(...)` directement sur le plugin fournisseur.
    OpenClaw n’a plus besoin de l’aide SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="Enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de prompt
    plate en texte brut à partir de messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur. Les plugins de canaux
    attachent les métadonnées de routage (fil, sujet, réponse à, réactions) comme
    champs typés au lieu de les concaténer dans une chaîne de prompt. L’aide
    `formatAgentEnvelope(...)` reste prise en charge pour les enveloppes synthétisées
    destinées à l’assistant, mais les enveloppes entrantes en texte brut sont en voie de
    retrait.

    Zones concernées : `inbound_claim`, `message_received`, et tout plugin de canal
    personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="Types de découverte de fournisseurs → types de catalogue de fournisseurs">
    Quatre alias de types de découverte sont désormais de fines enveloppes autour des
    types de l’ère catalogue :

    | Ancien alias              | Nouveau type              |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ainsi que l’ancien sac statique `ProviderCapabilities` - les plugins fournisseurs
    doivent utiliser des hooks fournisseur explicites tels que `buildReplayPolicy`,
    `normalizeToolSchemas` et `wrapStreamFn` plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="Hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un seul `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` facultatif et
    la liste classée des niveaux. OpenClaw rétrograde automatiquement les valeurs stockées obsolètes selon le rang
    du profil.

    Implémentez un hook au lieu de trois. Les hooks hérités continuent de fonctionner pendant
    la fenêtre de dépréciation, mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="Repli de fournisseur OAuth externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans
    déclarer le fournisseur dans le manifeste du plugin.

    **Nouveau** : déclarez `contracts.externalAuthProviders` dans le manifeste du plugin
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

  <Accordion title="Recherche de variable d’environnement fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : reflétez la même recherche de variable d’environnement dans `setup.providers[].envVars`
    sur le manifeste. Cela regroupe les métadonnées d’environnement de configuration/statut au même
    endroit et évite de démarrer l’exécution du plugin uniquement pour répondre aux
    recherches de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fermeture de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="Enregistrement du plugin de mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l’API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, un seul appel d’enregistrement. Les aides de mémoire additives
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas concernées.

  </Accordion>

  <Accordion title="Types de messages de session de sous-agent renommés">
    Deux alias de types hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                       | Nouveau                         |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode d’exécution `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode délègue à la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur task-flow actif.

    **Nouveau** : `runtime.tasks.managedFlows` conserve l’exécution de mutation TaskFlow
    gérée pour les plugins qui créent, mettent à jour, annulent ou exécutent des tâches enfants depuis un
    flux. Utilisez `runtime.tasks.flows` lorsque le plugin n’a besoin que de lectures basées sur des DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabriques d’extension intégrées → middleware de résultat d’outil agent">
    Couvert dans « Comment migrer → Migrer les extensions de résultats d’outil Pi vers
    le middleware » ci-dessus. Inclus ici par souci d’exhaustivité : le chemin Pi uniquement supprimé
    `api.registerEmbeddedExtensionFactory(...)` est remplacé par
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
Les dépréciations au niveau extension (dans les plugins de canaux/fournisseurs groupés sous
`extensions/`) sont suivies dans leurs propres barrels `api.ts` et `runtime-api.ts`.
Elles n’affectent pas les contrats des plugins tiers et ne sont pas listées
ici. Si vous consommez directement le barrel local d’un plugin groupé, lisez les
commentaires de dépréciation dans ce barrel avant la mise à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements à l’exécution       |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins principaux ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Liens connexes

- [Bien démarrer](/fr/plugins/building-plugins) - créer votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports par sous-chemin
- [Plugins de canaux](/fr/plugins/sdk-channel-plugins) - créer des plugins de canaux
- [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins) - créer des plugins fournisseurs
- [Internes des plugins](/fr/plugins/architecture) - exploration approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) - référence du schéma de manifeste
