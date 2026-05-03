---
read_when:
    - Vous intégrez le comportement de cycle de vie du moteur de contexte dans le harnais Codex
    - Vous avez besoin de lossless-claw ou d’un autre plugin de moteur de contexte pour travailler avec les sessions de harnais intégrées codex/*
    - Vous comparez le comportement du contexte du PI intégré et du serveur d’application Codex
summary: Spécification visant à faire en sorte que le harnais app-server Codex fourni prenne en compte les plugins du moteur de contexte OpenClaw
title: Portage du moteur de contexte du harnais Codex
x-i18n:
    generated_at: "2026-05-03T07:11:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Statut

Spécification d’implémentation en brouillon.

## Objectif

Faire en sorte que le harness app-server Codex groupé respecte le même contrat de cycle de vie du moteur de contexte OpenClaw que les tours PI intégrés respectent déjà.

Une session utilisant `agents.defaults.embeddedHarness.runtime: "codex"` ou un modèle `codex/*` doit toujours permettre au plugin de moteur de contexte sélectionné, comme `lossless-claw`, de contrôler l’assemblage du contexte, l’ingestion après tour, la maintenance et la politique de Compaction au niveau OpenClaw dans la mesure permise par la frontière app-server Codex.

## Non-objectifs

- Ne pas réimplémenter les internes de l’app-server Codex.
- Ne pas faire produire par la Compaction de fil native Codex un résumé lossless-claw.
- Ne pas exiger que les modèles non-Codex utilisent le harness Codex.
- Ne pas modifier le comportement des sessions ACP/acpx. Cette spécification concerne uniquement le chemin de harness d’agent intégré non-ACP.
- Ne pas faire enregistrer par des plugins tiers des fabriques d’extension app-server Codex ; la frontière de confiance existante des plugins groupés reste inchangée.

## Architecture actuelle

La boucle d’exécution intégrée résout le moteur de contexte configuré une fois par exécution avant de sélectionner un harness bas niveau concret :

- `src/agents/pi-embedded-runner/run.ts`
  - initialise les plugins de moteur de contexte
  - appelle `resolveContextEngine(params.config)`
  - transmet `contextEngine` et `contextTokenBudget` à
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` délègue au harness d’agent sélectionné :

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Le harness app-server Codex est enregistré par le plugin Codex groupé :

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L’implémentation du harness Codex reçoit les mêmes `EmbeddedRunAttemptParams` que les tentatives adossées à PI :

- `extensions/codex/src/app-server/run-attempt.ts`

Cela signifie que le point d’accroche requis se trouve dans du code contrôlé par OpenClaw. La frontière externe est le protocole app-server Codex lui-même : OpenClaw peut contrôler ce qu’il envoie à `thread/start`, `thread/resume` et `turn/start`, et peut observer les notifications, mais il ne peut pas modifier le magasin de fils interne de Codex ni son compacteur natif.

## Lacune actuelle

Les tentatives PI intégrées appellent directement le cycle de vie du moteur de contexte :

- bootstrap/maintenance avant la tentative
- assemblage avant l’appel au modèle
- afterTurn ou ingestion après la tentative
- maintenance après un tour réussi
- Compaction du moteur de contexte pour les moteurs qui possèdent la Compaction

Code PI pertinent :

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Les tentatives app-server Codex exécutent actuellement des hooks génériques de harness d’agent et mettent le transcript en miroir, mais n’appellent pas `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ni `params.contextEngine.maintain`.

Code Codex pertinent :

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportement souhaité

Pour les tours du harness Codex, OpenClaw doit préserver ce cycle de vie :

1. Lire le transcript de session OpenClaw mis en miroir.
2. Amorcer le moteur de contexte actif lorsqu’un fichier de session précédent existe.
3. Exécuter la maintenance de bootstrap lorsqu’elle est disponible.
4. Assembler le contexte avec le moteur de contexte actif.
5. Convertir le contexte assemblé en entrées compatibles avec Codex.
6. Démarrer ou reprendre le fil Codex avec des instructions développeur incluant tout `systemPromptAddition` du moteur de contexte.
7. Démarrer le tour Codex avec le prompt assemblé destiné à l’utilisateur.
8. Réintégrer le résultat Codex dans le transcript OpenClaw en miroir.
9. Appeler `afterTurn` si implémenté, sinon `ingestBatch`/`ingest`, en utilisant l’instantané du transcript en miroir.
10. Exécuter la maintenance de tour après les tours réussis non interrompus.
11. Préserver les signaux de Compaction native Codex et les hooks de Compaction OpenClaw.

## Contraintes de conception

### L’app-server Codex reste canonique pour l’état de fil natif

Codex possède son fil natif et tout historique étendu interne. OpenClaw ne doit pas essayer de modifier l’historique interne de l’app-server autrement que via les appels de protocole pris en charge.

Le miroir de transcript d’OpenClaw reste la source pour les fonctionnalités OpenClaw :

- historique de chat
- recherche
- tenue de registre de `/new` et `/reset`
- changement futur de modèle ou de harness
- état du plugin de moteur de contexte

### L’assemblage du moteur de contexte doit être projeté dans les entrées Codex

L’interface du moteur de contexte renvoie des `AgentMessage[]` OpenClaw, pas un correctif de fil Codex. `turn/start` de l’app-server Codex accepte une entrée utilisateur courante, tandis que `thread/start` et `thread/resume` acceptent des instructions développeur.

L’implémentation a donc besoin d’une couche de projection. La première version sûre doit éviter de prétendre pouvoir remplacer l’historique interne de Codex. Elle doit injecter le contexte assemblé sous forme de matériau déterministe de prompt/d’instructions développeur autour du tour courant.

### La stabilité du cache de prompt compte

Pour des moteurs comme lossless-claw, le contexte assemblé doit être déterministe pour des entrées inchangées. Ne pas ajouter d’horodatages, d’identifiants aléatoires ni d’ordre non déterministe au texte de contexte généré.

### La sémantique de sélection du runtime ne change pas

La sélection du harness reste inchangée :

- `runtime: "pi"` force PI
- `runtime: "codex"` sélectionne le harness Codex enregistré
- `runtime: "auto"` laisse les harnesses de plugins revendiquer les fournisseurs pris en charge
- les exécutions `auto` sans correspondance utilisent PI

Ce travail modifie ce qui se passe après la sélection du harness Codex.

## Plan d’implémentation

### 1. Exporter ou déplacer les helpers réutilisables de tentative de moteur de contexte

Aujourd’hui, les helpers réutilisables de cycle de vie vivent sous le runner PI :

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ne doit pas importer depuis un chemin d’implémentation dont le nom implique PI si nous pouvons l’éviter.

Créer un module neutre vis-à-vis du harness, par exemple :

- `src/agents/harness/context-engine-lifecycle.ts`

Déplacer ou réexporter :

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un petit wrapper autour de `runContextEngineMaintenance`

Conserver le fonctionnement des imports PI soit en réexportant depuis les anciens fichiers, soit en mettant à jour les sites d’appel PI dans la même PR.

Les noms de helpers neutres ne doivent pas mentionner PI.

Noms suggérés :

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Ajouter un helper de projection de contexte Codex

Ajouter un nouveau module :

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilités :

- Accepter les `AgentMessage[]` assemblés, l’historique miroir original et le prompt courant.
- Déterminer quel contexte appartient aux instructions développeur plutôt qu’à l’entrée utilisateur courante.
- Préserver le prompt utilisateur courant comme demande actionnable finale.
- Rendre les messages précédents dans un format stable et explicite.
- Éviter les métadonnées volatiles.

API proposée :

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

Première projection recommandée :

- Mettre `systemPromptAddition` dans les instructions développeur.
- Mettre le contexte de transcript assemblé avant le prompt courant dans `promptText`.
- L’étiqueter clairement comme contexte assemblé OpenClaw.
- Garder le prompt courant en dernier.
- Exclure le prompt utilisateur courant en double s’il apparaît déjà en fin de séquence.

Forme de prompt d’exemple :

```text
Contexte assemblé OpenClaw pour ce tour :

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Demande utilisateur actuelle :
...
```

C’est moins élégant qu’une chirurgie d’historique native Codex, mais c’est implémentable dans OpenClaw et préserve la sémantique du moteur de contexte.

Amélioration future : si l’app-server Codex expose un protocole pour remplacer ou compléter l’historique de fil, basculer cette couche de projection vers cette API.

### 3. Câbler le bootstrap avant le démarrage du fil Codex

Dans `extensions/codex/src/app-server/run-attempt.ts` :

- Lire l’historique de session en miroir comme aujourd’hui.
- Déterminer si le fichier de session existait avant cette exécution. Préférer un helper qui vérifie `fs.stat(params.sessionFile)` avant les écritures de mise en miroir.
- Ouvrir un `SessionManager` ou utiliser un adaptateur étroit de gestionnaire de session si le helper l’exige.
- Appeler le helper de bootstrap neutre lorsque `params.contextEngine` existe.

Pseudo-flux :

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

Utiliser la même convention de `sessionKey` que le pont d’outils Codex et le miroir de transcript. Aujourd’hui, Codex calcule `sandboxSessionKey` à partir de `params.sessionKey` ou `params.sessionId` ; l’utiliser de façon cohérente sauf s’il existe une raison de préserver `params.sessionKey` brut.

### 4. Câbler l’assemblage avant `thread/start` / `thread/resume` et `turn/start`

Dans `runCodexAppServerAttempt` :

1. Construire d’abord les outils dynamiques, afin que le moteur de contexte voie les vrais noms d’outils disponibles.
2. Lire l’historique de session en miroir.
3. Exécuter `assemble(...)` du moteur de contexte lorsque `params.contextEngine` existe.
4. Projeter le résultat assemblé en :
   - ajout d’instructions développeur
   - texte de prompt pour `turn/start`

L’appel de hook existant :

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

doit devenir conscient du contexte :

1. calculer les instructions développeur de base avec `buildDeveloperInstructions(params)`
2. appliquer l’assemblage/la projection du moteur de contexte
3. exécuter `before_prompt_build` avec le prompt/les instructions développeur projetés

Cet ordre permet aux hooks génériques de prompt de voir le même prompt que Codex recevra. Si nous avons besoin d’une parité PI stricte, exécuter l’assemblage du moteur de contexte avant la composition des hooks, car PI applique `systemPromptAddition` du moteur de contexte au prompt système final après son pipeline de prompt. L’invariant important est que le moteur de contexte et les hooks obtiennent tous deux un ordre déterministe et documenté.

Ordre recommandé pour la première implémentation :

1. `buildDeveloperInstructions(params)`
2. `assemble()` du moteur de contexte
3. ajouter/préfixer `systemPromptAddition` aux instructions développeur
4. projeter les messages assemblés dans le texte de prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. transmettre les instructions développeur finales à `startOrResumeThread(...)`
7. transmettre le texte de prompt final à `buildTurnStartParams(...)`

La spécification doit être encodée dans des tests afin que les changements futurs ne la réordonnent pas par accident.

### 5. Préserver un formatage stable pour le cache de prompt

Le helper de projection doit produire une sortie stable octet pour octet pour des entrées identiques :

- ordre stable des messages
- libellés de rôles stables
- aucun horodatage généré
- aucune fuite d’ordre des clés d’objet
- aucun délimiteur aléatoire
- aucun identifiant par exécution

Utiliser des délimiteurs fixes et des sections explicites.

### 6. Câbler l’après-tour après la mise en miroir du transcript

Le `CodexAppServerEventProjector` de Codex construit un `messagesSnapshot` local pour le
tour actuel. `mirrorTranscriptBestEffort(...)` écrit cet instantané dans le
miroir de transcription OpenClaw.

Après la réussite ou l’échec de la mise en miroir, appelez le finaliseur du moteur
de contexte avec le meilleur instantané de messages disponible :

- Préférer le contexte complet de session mis en miroir après l’écriture, car `afterTurn`
  attend l’instantané de session, pas seulement le tour actuel.
- Se rabattre sur `historyMessages + result.messagesSnapshot` si le fichier de session
  ne peut pas être rouvert.

Pseudo-flux :

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

Si la mise en miroir échoue, appelez tout de même `afterTurn` avec l’instantané de
repli, mais consignez que le moteur de contexte ingère les données de tour de repli.

### 7. Normaliser l’utilisation et le contexte d’exécution du cache de prompt

Les résultats Codex incluent l’utilisation normalisée à partir des notifications
de jetons app-server lorsqu’elles sont disponibles. Transmettez cette utilisation
au contexte d’exécution du moteur de contexte.

Si l’app-server Codex expose finalement les détails de lecture/écriture du cache,
mappez-les vers `ContextEnginePromptCacheInfo`. D’ici là, omettez `promptCache`
au lieu d’inventer des zéros.

### 8. Politique de Compaction

Il existe deux systèmes de Compaction :

1. `compact()` du moteur de contexte OpenClaw
2. `thread/compact/start` natif de l’app-server Codex

Ne les amalgamez pas silencieusement.

#### `/compact` et Compaction OpenClaw explicite

Lorsque le moteur de contexte sélectionné a `info.ownsCompaction === true`, la
Compaction OpenClaw explicite doit privilégier le résultat `compact()` du moteur
de contexte pour le miroir de transcription OpenClaw et l’état du Plugin.

Lorsque le harnais Codex sélectionné a une liaison de fil native, nous pouvons en
plus demander une Compaction native Codex pour garder le fil app-server sain, mais
cela doit être signalé comme une action backend distincte dans les détails.

Comportement recommandé :

- Si `contextEngine.info.ownsCompaction === true` :
  - appeler d’abord `compact()` du moteur de contexte
  - puis appeler la Compaction native Codex au mieux lorsqu’une liaison de fil existe
  - renvoyer le résultat du moteur de contexte comme résultat principal
  - inclure le statut de la Compaction native Codex dans `details.codexNativeCompaction`
- Si le moteur de contexte actif ne possède pas la Compaction :
  - préserver le comportement actuel de Compaction native Codex

Cela nécessite probablement de modifier `extensions/codex/src/app-server/compact.ts`
ou de l’envelopper depuis le chemin de Compaction générique, selon l’endroit où
`maybeCompactAgentHarnessSession(...)` est invoqué.

#### Événements Codex natifs contextCompaction pendant le tour

Codex peut émettre des événements d’élément `contextCompaction` pendant un tour.
Conservez l’émission actuelle des hooks avant/après Compaction dans
`event-projector.ts`, mais ne traitez pas cela comme une Compaction de moteur de
contexte terminée.

Pour les moteurs qui possèdent la Compaction, émettez un diagnostic explicite
lorsque Codex effectue quand même une Compaction native :

- nom de flux/événement : le flux `compaction` existant est acceptable
- détails : `{ backend: "codex-app-server", ownsCompaction: true }`

Cela rend la séparation vérifiable.

### 9. Comportement de réinitialisation et de liaison de session

Le `reset(...)` existant du harnais Codex efface la liaison app-server Codex du
fichier de session OpenClaw. Préservez ce comportement.

Assurez-vous aussi que le nettoyage de l’état du moteur de contexte continue de
passer par les chemins existants du cycle de vie de session OpenClaw. N’ajoutez
pas de nettoyage spécifique à Codex sauf si le cycle de vie du moteur de contexte
ignore actuellement les événements de réinitialisation/suppression pour tous les
harnais.

### 10. Gestion des erreurs

Suivez la sémantique PI :

- les échecs d’amorçage avertissent et continuent
- les échecs d’assemblage avertissent et se rabattent sur les messages/prompts
  du pipeline non assemblé
- les échecs `afterTurn`/ingest avertissent et marquent la finalisation post-tour
  comme non réussie
- la maintenance ne s’exécute qu’après des tours réussis, non abandonnés et sans yield
- les erreurs de Compaction ne doivent pas être retentées comme des prompts frais

Ajouts spécifiques à Codex :

- Si la projection de contexte échoue, avertir et se rabattre sur le prompt d’origine.
- Si le miroir de transcription échoue, tenter tout de même la finalisation du moteur
  de contexte avec les messages de repli.
- Si la Compaction native Codex échoue après la réussite de la Compaction du moteur
  de contexte, ne faites pas échouer toute la Compaction OpenClaw lorsque le moteur
  de contexte est principal.

## Plan de test

### Tests unitaires

Ajoutez des tests sous `extensions/codex/src/app-server` :

1. `run-attempt.context-engine.test.ts`
   - Codex appelle `bootstrap` lorsqu’un fichier de session existe.
   - Codex appelle `assemble` avec les messages mis en miroir, le budget de jetons,
     les noms d’outils, le mode citations, l’id de modèle et le prompt.
   - `systemPromptAddition` est inclus dans les instructions développeur.
   - Les messages assemblés sont projetés dans le prompt avant la requête actuelle.
   - Codex appelle `afterTurn` après la mise en miroir de la transcription.
   - Sans `afterTurn`, Codex appelle `ingestBatch` ou `ingest` par message.
   - La maintenance de tour s’exécute après les tours réussis.
   - La maintenance de tour ne s’exécute pas en cas d’erreur de prompt, d’abandon
     ou d’abandon de yield.

2. `context-engine-projection.test.ts`
   - sortie stable pour des entrées identiques
   - aucun doublon du prompt actuel lorsque l’historique assemblé l’inclut
   - gère un historique vide
   - préserve l’ordre des rôles
   - inclut l’ajout de prompt système uniquement dans les instructions développeur

3. `compact.context-engine.test.ts`
   - le résultat principal du moteur de contexte propriétaire l’emporte
   - le statut de Compaction native Codex apparaît dans les détails lorsqu’elle est
     aussi tentée
   - l’échec natif Codex ne fait pas échouer la Compaction du moteur de contexte
     propriétaire
   - un moteur de contexte non propriétaire préserve le comportement actuel de
     Compaction native

### Tests existants à mettre à jour

- `extensions/codex/src/app-server/run-attempt.test.ts` s’il est présent, sinon
  les tests d’exécution app-server Codex les plus proches.
- `extensions/codex/src/app-server/event-projector.test.ts` uniquement si les
  détails d’événement de Compaction changent.
- `src/agents/harness/selection.test.ts` ne devrait pas nécessiter de changements
  sauf si le comportement de configuration change ; il devrait rester stable.
- Les tests du moteur de contexte PI doivent continuer à passer sans changement.

### Tests d’intégration / live

Ajoutez ou étendez les tests smoke live du harnais Codex :

- configurer `plugins.slots.contextEngine` sur un moteur de test
- configurer `agents.defaults.model` sur un modèle `codex/*`
- configurer `agents.defaults.embeddedHarness.runtime = "codex"`
- vérifier que le moteur de test a observé :
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - maintenance

Évitez d’exiger lossless-claw dans les tests de cœur OpenClaw. Utilisez un petit
Plugin de moteur de contexte factice dans le dépôt.

## Observabilité

Ajoutez des journaux de débogage autour des appels de cycle de vie du moteur de
contexte Codex :

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` avec la raison
- `codex native compaction completed alongside context-engine compaction`

Évitez de journaliser les prompts complets ou le contenu des transcriptions.

Ajoutez des champs structurés lorsque c’est utile :

- `sessionId`
- `sessionKey` expurgé ou omis selon la pratique de journalisation existante
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibilité

Cela doit être rétrocompatible :

- Si aucun moteur de contexte n’est configuré, le comportement hérité du moteur de
  contexte doit être équivalent au comportement actuel du harnais Codex.
- Si `assemble` du moteur de contexte échoue, Codex doit continuer avec le chemin
  de prompt d’origine.
- Les liaisons de fil Codex existantes doivent rester valides.
- L’empreinte dynamique des outils ne doit pas inclure la sortie du moteur de contexte ;
  sinon, chaque changement de contexte pourrait forcer un nouveau fil Codex. Seul le
  catalogue d’outils doit affecter l’empreinte dynamique des outils.

## Questions ouvertes

1. Le contexte assemblé doit-il être injecté entièrement dans le prompt utilisateur,
   entièrement dans les instructions développeur, ou réparti ?

   Recommandation : le répartir. Mettez `systemPromptAddition` dans les instructions
   développeur ; mettez le contexte de transcription assemblé dans l’enveloppe de
   prompt utilisateur. Cela correspond le mieux au protocole Codex actuel sans
   muter l’historique de fil natif.

2. La Compaction native Codex doit-elle être désactivée lorsqu’un moteur de contexte
   possède la Compaction ?

   Recommandation : non, pas initialement. La Compaction native Codex peut encore
   être nécessaire pour maintenir le fil app-server en vie. Mais elle doit être
   signalée comme Compaction native Codex, pas comme Compaction de moteur de contexte.

3. `before_prompt_build` doit-il s’exécuter avant ou après l’assemblage du moteur
   de contexte ?

   Recommandation : après la projection du moteur de contexte pour Codex, afin que
   les hooks de harnais génériques voient le prompt et les instructions développeur
   réels que Codex recevra. Si la parité PI exige l’inverse, encodez l’ordre choisi
   dans les tests et documentez-le ici.

4. L’app-server Codex peut-il accepter à l’avenir une surcharge structurée de
   contexte/historique ?

   Inconnu. Si c’est possible, remplacez la couche de projection textuelle par ce
   protocole et conservez les appels de cycle de vie inchangés.

## Critères d’acceptation

- Un tour de harnais intégré `codex/*` invoque le cycle de vie assemble du moteur
  de contexte sélectionné.
- Un `systemPromptAddition` du moteur de contexte affecte les instructions
  développeur Codex.
- Le contexte assemblé affecte l’entrée du tour Codex de façon déterministe.
- Les tours Codex réussis appellent `afterTurn` ou le repli d’ingestion.
- Les tours Codex réussis exécutent la maintenance de tour du moteur de contexte.
- Les tours échoués/abandonnés/abandonnés par yield n’exécutent pas la maintenance
  de tour.
- La Compaction détenue par le moteur de contexte reste principale pour l’état
  OpenClaw/Plugin.
- La Compaction native Codex reste vérifiable comme comportement Codex natif.
- Le comportement existant du moteur de contexte PI est inchangé.
- Le comportement existant du harnais Codex est inchangé lorsqu’aucun moteur de
  contexte non hérité n’est sélectionné ou lorsque l’assemblage échoue.
