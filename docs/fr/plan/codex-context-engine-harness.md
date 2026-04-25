---
read_when:
    - Vous intégrez le comportement du cycle de vie du moteur de contexte dans le harnais Codex
    - Vous avez besoin que lossless-claw ou un autre Plugin de moteur de contexte fonctionne avec les sessions de harnais intégré `codex/*`
    - Vous comparez le comportement de contexte PI intégré et app-server Codex
summary: Spécification pour faire en sorte que le harnais app-server Codex intégré respecte les Plugins de moteur de contexte OpenClaw
title: Port du moteur de contexte du harnais Codex
x-i18n:
    generated_at: "2026-04-25T13:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Statut

Spécification d’implémentation à l’état de brouillon.

## Objectif

Faire en sorte que le harnais app-server Codex intégré respecte le même contrat de cycle de vie
du moteur de contexte OpenClaw que celui déjà respecté par les tours PI intégrés.

Une session utilisant `agents.defaults.embeddedHarness.runtime: "codex"` ou un
modèle `codex/*` doit toujours permettre au Plugin de moteur de contexte sélectionné, tel que
`lossless-claw`, de contrôler l’assemblage du contexte, l’ingestion après tour, la maintenance et
la politique de Compaction au niveau OpenClaw, dans la mesure permise par la frontière de l’app-server Codex.

## Non-objectifs

- Ne pas réimplémenter les composants internes de l’app-server Codex.
- Ne pas faire produire par la Compaction native des fils Codex un résumé lossless-claw.
- Ne pas exiger que les modèles non-Codex utilisent le harnais Codex.
- Ne pas modifier le comportement des sessions ACP/acpx. Cette spécification concerne uniquement le
  chemin de harnais d’agent intégré non-ACP.
- Ne pas faire enregistrer par des plugins tiers des fabriques d’extensions d’app-server Codex ;
  la frontière de confiance existante des plugins intégrés reste inchangée.

## Architecture actuelle

La boucle d’exécution intégrée résout le moteur de contexte configuré une fois par exécution avant
de sélectionner un harnais bas niveau concret :

- `src/agents/pi-embedded-runner/run.ts`
  - initialise les plugins de moteur de contexte
  - appelle `resolveContextEngine(params.config)`
  - transmet `contextEngine` et `contextTokenBudget` à
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` délègue au harnais d’agent sélectionné :

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Le harnais app-server Codex est enregistré par le Plugin Codex intégré :

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L’implémentation du harnais Codex reçoit les mêmes `EmbeddedRunAttemptParams`
que les tentatives adossées à PI :

- `extensions/codex/src/app-server/run-attempt.ts`

Cela signifie que le point d’accroche requis se trouve dans du code contrôlé par OpenClaw. La frontière
externe est le protocole app-server Codex lui-même : OpenClaw peut contrôler ce qu’il
envoie à `thread/start`, `thread/resume` et `turn/start`, et peut observer les
notifications, mais il ne peut pas modifier le stockage interne des fils de Codex ni son compacteur natif.

## Lacune actuelle

Les tentatives PI intégrées appellent directement le cycle de vie du moteur de contexte :

- bootstrap/maintenance avant la tentative
- assemble avant l’appel au modèle
- afterTurn ou ingest après la tentative
- maintenance après un tour réussi
- Compaction du moteur de contexte pour les moteurs qui possèdent la Compaction

Code PI pertinent :

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Les tentatives app-server Codex exécutent actuellement des hooks génériques de harnais d’agent et reflètent
la transcription, mais n’appellent pas `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ou
`params.contextEngine.maintain`.

Code Codex pertinent :

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportement souhaité

Pour les tours du harnais Codex, OpenClaw doit préserver ce cycle de vie :

1. Lire la transcription de session OpenClaw reflétée.
2. Initialiser le moteur de contexte actif lorsqu’un fichier de session précédent existe.
3. Exécuter la maintenance de bootstrap lorsqu’elle est disponible.
4. Assembler le contexte à l’aide du moteur de contexte actif.
5. Convertir le contexte assemblé en entrées compatibles Codex.
6. Démarrer ou reprendre le fil Codex avec des instructions développeur qui incluent toute
   `systemPromptAddition` du moteur de contexte.
7. Démarrer le tour Codex avec le prompt assemblé orienté utilisateur.
8. Refléter le résultat Codex dans la transcription OpenClaw.
9. Appeler `afterTurn` si implémenté, sinon `ingestBatch`/`ingest`, en utilisant le
   snapshot de transcription reflété.
10. Exécuter la maintenance du tour après les tours réussis et non interrompus.
11. Préserver les signaux de Compaction native de Codex et les hooks de Compaction OpenClaw.

## Contraintes de conception

### L’app-server Codex reste canonique pour l’état natif des fils

Codex possède son fil natif et tout historique interne étendu. OpenClaw ne doit
pas essayer de modifier l’historique interne de l’app-server sauf via des appels
de protocole pris en charge.

Le miroir de transcription OpenClaw reste la source pour les fonctionnalités OpenClaw :

- historique du chat
- recherche
- comptabilité `/new` et `/reset`
- futur changement de modèle ou de harnais
- état du Plugin de moteur de contexte

### L’assemblage du moteur de contexte doit être projeté dans les entrées Codex

L’interface du moteur de contexte renvoie des `AgentMessage[]` OpenClaw, pas un
patch de fil Codex. L’app-server Codex `turn/start` accepte une entrée utilisateur actuelle, tandis que
`thread/start` et `thread/resume` acceptent des instructions développeur.

L’implémentation a donc besoin d’une couche de projection. La première version sûre
doit éviter de prétendre qu’elle peut remplacer l’historique interne de Codex. Elle doit injecter
le contexte assemblé comme matériau déterministe de prompt/instruction développeur autour
du tour courant.

### La stabilité du cache de prompt est importante

Pour des moteurs comme lossless-claw, le contexte assemblé doit être déterministe
pour des entrées inchangées. Ne pas ajouter d’horodatages, d’identifiants aléatoires ni
d’ordre non déterministe au texte de contexte généré.

### La sémantique de repli PI ne change pas

La sélection du harnais reste telle quelle :

- `runtime: "pi"` force PI
- `runtime: "codex"` sélectionne le harnais Codex enregistré
- `runtime: "auto"` laisse les harnais de Plugin revendiquer les fournisseurs pris en charge
- `fallback: "none"` désactive le repli PI lorsqu’aucun harnais de Plugin ne correspond

Ce travail modifie ce qui se passe après la sélection du harnais Codex.

## Plan d’implémentation

### 1. Exporter ou déplacer des helpers réutilisables de tentative du moteur de contexte

Aujourd’hui, les helpers réutilisables du cycle de vie se trouvent sous le runner PI :

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ne doit pas importer depuis un chemin d’implémentation dont le nom implique PI si
nous pouvons l’éviter.

Créer un module neutre vis-à-vis du harnais, par exemple :

- `src/agents/harness/context-engine-lifecycle.ts`

Déplacer ou réexporter :

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un petit wrapper autour de `runContextEngineMaintenance`

Conserver le fonctionnement des imports PI soit en réexportant depuis les anciens fichiers, soit en mettant à jour les sites d’appel PI dans la même PR.

Les noms neutres des helpers ne doivent pas mentionner PI.

Noms suggérés :

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Ajouter un helper de projection de contexte Codex

Ajouter un nouveau module :

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilités :

- Accepter les `AgentMessage[]` assemblés, l’historique reflété original et le prompt
  courant.
- Déterminer quelle partie du contexte appartient aux instructions développeur par rapport à l’entrée utilisateur actuelle.
- Préserver le prompt utilisateur courant comme requête finale actionnable.
- Rendre les messages précédents dans un format stable et explicite.
- Éviter les métadonnées volatiles.

API proposée :

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Première projection recommandée :

- Mettre `systemPromptAddition` dans les instructions développeur.
- Mettre le contexte de transcription assemblé avant le prompt courant dans `promptText`.
- L’indiquer clairement comme contexte assemblé OpenClaw.
- Garder le prompt courant à la fin.
- Exclure le prompt utilisateur courant en doublon s’il apparaît déjà en queue.

Forme d’invite exemple :

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

C’est moins élégant qu’une chirurgie native de l’historique Codex, mais c’est implémentable
dans OpenClaw et préserve la sémantique du moteur de contexte.

Amélioration future : si l’app-server Codex expose un protocole pour remplacer ou
compléter l’historique du fil, remplacer cette couche de projection pour utiliser cette API.

### 3. Câbler le bootstrap avant le démarrage du fil Codex

Dans `extensions/codex/src/app-server/run-attempt.ts` :

- Lire l’historique de session reflété comme aujourd’hui.
- Déterminer si le fichier de session existait avant cette exécution. Préférer un helper
  qui vérifie `fs.stat(params.sessionFile)` avant les écritures miroir.
- Ouvrir un `SessionManager` ou utiliser un adaptateur étroit de gestionnaire de session si le helper
  l’exige.
- Appeler le helper bootstrap neutre lorsque `params.contextEngine` existe.

Pseudo-flux :

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Utiliser la même convention `sessionKey` que le bridge d’outil Codex et le miroir
de transcription. Aujourd’hui Codex calcule `sandboxSessionKey` à partir de `params.sessionKey` ou
`params.sessionId` ; utiliser cela de manière cohérente sauf s’il existe une raison de préserver
`params.sessionKey` brut.

### 4. Câbler assemble avant `thread/start` / `thread/resume` et `turn/start`

Dans `runCodexAppServerAttempt` :

1. Construire d’abord les outils dynamiques, afin que le moteur de contexte voie les vrais
   noms des outils disponibles.
2. Lire l’historique de session reflété.
3. Exécuter `assemble(...)` du moteur de contexte lorsque `params.contextEngine` existe.
4. Projeter le résultat assemblé dans :
   - un ajout aux instructions développeur
   - le texte du prompt pour `turn/start`

L’appel de hook existant :

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

doit devenir conscient du contexte :

1. calculer les instructions développeur de base avec `buildDeveloperInstructions(params)`
2. appliquer l’assemblage/projection du moteur de contexte
3. exécuter `before_prompt_build` avec le prompt/instructions développeur projetés

Cet ordre permet aux hooks génériques de prompt de voir le même prompt que celui reçu par Codex. Si
nous avons besoin d’une parité stricte avec PI, exécuter l’assemblage du moteur de contexte avant la composition des hooks,
car PI applique `systemPromptAddition` du moteur de contexte au prompt système final après son pipeline
de prompt. L’invariant important est que le moteur de contexte et les hooks obtiennent tous deux
un ordre déterministe et documenté.

Ordre recommandé pour la première implémentation :

1. `buildDeveloperInstructions(params)`
2. `assemble()` du moteur de contexte
3. ajouter/préfixer `systemPromptAddition` aux instructions développeur
4. projeter les messages assemblés dans le texte du prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. transmettre les instructions développeur finales à `startOrResumeThread(...)`
7. transmettre le texte de prompt final à `buildTurnStartParams(...)`

La spécification doit être encodée dans des tests afin que les modifications futures ne réordonnent pas cela par accident.

### 5. Préserver un formatage stable pour le cache de prompt

Le helper de projection doit produire une sortie stable en octets pour des entrées identiques :

- ordre stable des messages
- libellés de rôle stables
- aucun horodatage généré
- aucune fuite d’ordre des clés d’objet
- aucun délimiteur aléatoire
- aucun identifiant par exécution

Utiliser des délimiteurs fixes et des sections explicites.

### 6. Câbler l’après-tour après le miroir de transcription

Le `CodexAppServerEventProjector` de Codex construit un `messagesSnapshot` local pour le
tour courant. `mirrorTranscriptBestEffort(...)` écrit ce snapshot dans le miroir de transcription OpenClaw.

Après réussite ou échec du miroir, appeler le finaliseur du moteur de contexte avec le
meilleur snapshot de messages disponible :

- Préférer le contexte complet de session reflétée après l’écriture, car `afterTurn`
  attend le snapshot de session, pas seulement le tour courant.
- Revenir à `historyMessages + result.messagesSnapshot` si le fichier de session
  ne peut pas être rouvert.

Pseudo-flux :

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Si le miroir échoue, appeler quand même `afterTurn` avec le snapshot de repli, mais journaliser
que le moteur de contexte ingère à partir des données de tour de repli.

### 7. Normaliser le contexte d’exécution d’usage et de cache de prompt

Les résultats Codex incluent un usage normalisé à partir des notifications de jetons app-server lorsque
disponibles. Transmettre cet usage dans le contexte d’exécution du moteur de contexte.

Si l’app-server Codex expose finalement les détails de lecture/écriture du cache, les mapper dans
`ContextEnginePromptCacheInfo`. D’ici là, omettre `promptCache` plutôt que
d’inventer des zéros.

### 8. Politique de Compaction

Il y a deux systèmes de Compaction :

1. `compact()` du moteur de contexte OpenClaw
2. `thread/compact/start` natif de l’app-server Codex

Ne pas les confondre silencieusement.

#### `/compact` et Compaction OpenClaw explicite

Lorsque le moteur de contexte sélectionné a `info.ownsCompaction === true`, la
Compaction OpenClaw explicite doit privilégier le résultat de `compact()` du moteur de contexte pour
le miroir de transcription OpenClaw et l’état du Plugin.

Lorsque le harnais Codex sélectionné possède une liaison de fil native, nous pouvons en plus
demander une Compaction native Codex pour garder le fil app-server sain, mais cela
doit être signalé comme une action backend distincte dans les détails.

Comportement recommandé :

- Si `contextEngine.info.ownsCompaction === true` :
  - appeler d’abord `compact()` du moteur de contexte
  - puis appeler au mieux la Compaction native Codex lorsqu’une liaison de fil existe
  - renvoyer le résultat du moteur de contexte comme résultat principal
  - inclure l’état de Compaction native Codex dans `details.codexNativeCompaction`
- Si le moteur de contexte actif ne possède pas la Compaction :
  - préserver le comportement actuel de Compaction native Codex

Cela nécessitera probablement de modifier `extensions/codex/src/app-server/compact.ts` ou
de l’envelopper depuis le chemin de Compaction générique, selon l’endroit où
`maybeCompactAgentHarnessSession(...)` est invoqué.

#### Événements natifs `contextCompaction` Codex pendant un tour

Codex peut émettre des événements d’élément `contextCompaction` pendant un tour. Conserver l’émission
actuelle des hooks de Compaction avant/après dans `event-projector.ts`, mais ne pas traiter
cela comme une Compaction complète du moteur de contexte.

Pour les moteurs qui possèdent la Compaction, émettre un diagnostic explicite lorsque Codex effectue
quand même une Compaction native :

- nom de flux/événement : le flux `compaction` existant est acceptable
- détails : `{ backend: "codex-app-server", ownsCompaction: true }`

Cela rend la séparation vérifiable.

### 9. Réinitialisation de session et comportement de liaison

Le `reset(...)` existant du harnais Codex efface la liaison app-server Codex du
fichier de session OpenClaw. Préserver ce comportement.

S’assurer également que le nettoyage de l’état du moteur de contexte continue de se produire via les chemins
existants du cycle de vie de session OpenClaw. Ne pas ajouter de nettoyage spécifique à Codex sauf si le
cycle de vie du moteur de contexte manque actuellement les événements reset/delete pour tous les harnais.

### 10. Gestion des erreurs

Suivre la sémantique PI :

- les échecs de bootstrap déclenchent un avertissement et on continue
- les échecs d’assemble déclenchent un avertissement et reviennent aux messages/prompts non assemblés du pipeline
- les échecs de afterTurn/ingest déclenchent un avertissement et marquent la finalisation post-tour comme échouée
- la maintenance ne s’exécute qu’après des tours réussis, non interrompus, sans yield abort
- les erreurs de Compaction ne doivent pas être réessayées comme de nouveaux prompts

Ajouts spécifiques à Codex :

- Si la projection de contexte échoue, journaliser un avertissement et revenir au prompt d’origine.
- Si le miroir de transcription échoue, tenter quand même la finalisation du moteur de contexte avec
  les messages de repli.
- Si la Compaction native Codex échoue après que la Compaction du moteur de contexte a réussi,
  ne pas faire échouer toute la Compaction OpenClaw lorsque le moteur de contexte est primaire.

## Plan de test

### Tests unitaires

Ajouter des tests sous `extensions/codex/src/app-server` :

1. `run-attempt.context-engine.test.ts`
   - Codex appelle `bootstrap` lorsqu’un fichier de session existe.
   - Codex appelle `assemble` avec les messages reflétés, le budget de jetons, les noms d’outils,
     le mode citations, l’identifiant du modèle et le prompt.
   - `systemPromptAddition` est inclus dans les instructions développeur.
   - Les messages assemblés sont projetés dans le prompt avant la requête courante.
   - Codex appelle `afterTurn` après le miroir de transcription.
   - Sans `afterTurn`, Codex appelle `ingestBatch` ou `ingest` par message.
   - La maintenance du tour s’exécute après les tours réussis.
   - La maintenance du tour ne s’exécute pas en cas d’erreur de prompt, d’abandon ou de yield abort.

2. `context-engine-projection.test.ts`
   - sortie stable pour des entrées identiques
   - pas de prompt courant dupliqué lorsque l’historique assemblé l’inclut
   - gère un historique vide
   - préserve l’ordre des rôles
   - inclut l’ajout de prompt système uniquement dans les instructions développeur

3. `compact.context-engine.test.ts`
   - le résultat principal du moteur de contexte propriétaire l’emporte
   - l’état de Compaction native Codex apparaît dans les détails lorsqu’elle est aussi tentée
   - l’échec de la Compaction native Codex ne fait pas échouer la Compaction du moteur de contexte propriétaire
   - un moteur de contexte non propriétaire préserve le comportement actuel de Compaction native

### Tests existants à mettre à jour

- `extensions/codex/src/app-server/run-attempt.test.ts` si présent, sinon
  les tests d’exécution app-server Codex les plus proches.
- `extensions/codex/src/app-server/event-projector.test.ts` uniquement si les détails des événements
  de Compaction changent.
- `src/agents/harness/selection.test.ts` ne devrait pas nécessiter de changements sauf si le comportement de configuration change ; il doit rester stable.
- Les tests PI de moteur de contexte doivent continuer à réussir sans modification.

### Tests d’intégration / live

Ajouter ou étendre les tests smoke live du harnais Codex :

- configurer `plugins.slots.contextEngine` vers un moteur de test
- configurer `agents.defaults.model` vers un modèle `codex/*`
- configurer `agents.defaults.embeddedHarness.runtime = "codex"`
- vérifier que le moteur de test a observé :
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - maintenance

Éviter d’exiger lossless-claw dans les tests core OpenClaw. Utiliser un petit
Plugin de moteur de contexte factice dans le dépôt.

## Observabilité

Ajouter des journaux de débogage autour des appels du cycle de vie du moteur de contexte Codex :

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` avec la raison
- `codex native compaction completed alongside context-engine compaction`

Éviter de journaliser les prompts complets ou le contenu des transcriptions.

Ajouter des champs structurés lorsque c’est utile :

- `sessionId`
- `sessionKey` expurgé ou omis selon la pratique de journalisation existante
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibilité

Cela doit être rétrocompatible :

- Si aucun moteur de contexte n’est configuré, le comportement hérité du moteur de contexte doit être
  équivalent au comportement actuel du harnais Codex.
- Si `assemble` du moteur de contexte échoue, Codex doit continuer avec le chemin
  de prompt d’origine.
- Les liaisons de fil Codex existantes doivent rester valides.
- L’empreinte des outils dynamiques ne doit pas inclure la sortie du moteur de contexte ; sinon
  chaque changement de contexte pourrait forcer un nouveau fil Codex. Seul le catalogue
  d’outils doit affecter l’empreinte des outils dynamiques.

## Questions ouvertes

1. Le contexte assemblé doit-il être injecté entièrement dans le prompt utilisateur, entièrement
   dans les instructions développeur, ou réparti ?

   Recommandation : réparti. Mettre `systemPromptAddition` dans les instructions développeur ;
   mettre le contexte de transcription assemblé dans l’enveloppe de prompt utilisateur. Cela correspond le mieux
   au protocole Codex actuel sans modifier l’historique natif du fil.

2. Faut-il désactiver la Compaction native Codex lorsqu’un moteur de contexte possède
   la Compaction ?

   Recommandation : non, pas initialement. La Compaction native Codex peut encore être
   nécessaire pour maintenir le fil app-server vivant. Mais elle doit être signalée comme
   Compaction native Codex, et non comme Compaction du moteur de contexte.

3. `before_prompt_build` doit-il s’exécuter avant ou après l’assemblage du moteur de contexte ?

   Recommandation : après la projection du moteur de contexte pour Codex, afin que les hooks génériques du harnais
   voient le vrai prompt/les vraies instructions développeur que Codex recevra. Si la parité avec PI
   exige l’inverse, encoder l’ordre choisi dans les tests et le documenter
   ici.

4. L’app-server Codex peut-il accepter à l’avenir un remplacement structuré de contexte/historique ?

   Inconnu. Si oui, remplacer la couche de projection texte par ce protocole et
   conserver les appels du cycle de vie inchangés.

## Critères d’acceptation

- Un tour de harnais intégré `codex/*` invoque le cycle de vie assemble du
  moteur de contexte sélectionné.
- Un `systemPromptAddition` de moteur de contexte affecte les instructions développeur Codex.
- Le contexte assemblé affecte l’entrée du tour Codex de manière déterministe.
- Les tours Codex réussis appellent `afterTurn` ou le repli ingest.
- Les tours Codex réussis exécutent la maintenance de tour du moteur de contexte.
- Les tours échoués/interrompus/yield-aborted n’exécutent pas la maintenance du tour.
- La Compaction possédée par le moteur de contexte reste primaire pour l’état OpenClaw/Plugin.
- La Compaction native Codex reste vérifiable comme comportement natif Codex.
- Le comportement du moteur de contexte PI existant est inchangé.
- Le comportement du harnais Codex existant est inchangé lorsqu’aucun moteur de contexte non hérité
  n’est sélectionné ou lorsque l’assemblage échoue.
