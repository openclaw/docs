---
read_when:
    - Vous intégrez le comportement de cycle de vie du moteur de contexte dans le harnais Codex
    - Vous avez besoin de lossless-claw ou d’un autre Plugin de moteur de contexte pour travailler avec les sessions de harnais intégrées codex/*
    - Vous comparez le comportement du contexte du serveur d’application intégré d’OpenClaw et de Codex
summary: Spécification pour faire en sorte que le harnais de serveur d’application Codex intégré respecte les Plugins de moteur de contexte OpenClaw
title: Portage du moteur de contexte du harnais Codex
x-i18n:
    generated_at: "2026-06-27T17:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## État

Spécification d’implémentation à l’état de brouillon.

## Objectif

Faire en sorte que le harnais app-server Codex fourni respecte le même contrat de
cycle de vie du moteur de contexte OpenClaw que les tours OpenClaw intégrés
respectent déjà.

Une session utilisant le fournisseur/modèle `agentRuntime.id: "codex"` ou un modèle
`codex/*` doit toujours permettre au plugin de moteur de contexte sélectionné, tel
que `lossless-claw`, de contrôler l’assemblage du contexte, l’ingestion après tour,
la maintenance et la politique de Compaction au niveau OpenClaw dans la mesure
permise par la frontière de l’app-server Codex.

## Non-objectifs

- Ne pas réimplémenter les internes de l’app-server Codex.
- Ne pas faire produire un résumé lossless-claw par la Compaction native des fils Codex.
- Ne pas exiger que les modèles non-Codex utilisent le harnais Codex.
- Ne pas modifier le comportement des sessions ACP/acpx. Cette spécification concerne
  uniquement le chemin du harnais d’agent intégré non ACP.
- Ne pas faire enregistrer par des plugins tiers des fabriques d’extensions app-server Codex ;
  la frontière de confiance existante des plugins fournis reste inchangée.

## Architecture actuelle

La boucle d’exécution intégrée résout le moteur de contexte configuré une fois par
exécution avant de sélectionner un harnais bas niveau concret :

- `src/agents/embedded-agent-runner/run.ts`
  - initialise les plugins de moteur de contexte
  - appelle `resolveContextEngine(params.config)`
  - transmet `contextEngine` et `contextTokenBudget` à
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` délègue au harnais d’agent sélectionné :

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Le harnais app-server Codex est enregistré par le plugin Codex fourni :

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L’implémentation du harnais Codex reçoit les mêmes `EmbeddedRunAttemptParams`
que les tentatives OpenClaw intégrées :

- `extensions/codex/src/app-server/run-attempt.ts`

Cela signifie que le point d’accroche requis se trouve dans du code contrôlé par
OpenClaw. La frontière externe est le protocole app-server Codex lui-même :
OpenClaw peut contrôler ce qu’il envoie à `thread/start`, `thread/resume` et
`turn/start`, et peut observer les notifications, mais il ne peut pas modifier le
stockage interne des fils Codex ni le compacteur natif.

## Écart actuel

Les tentatives OpenClaw intégrées appellent directement le cycle de vie du moteur de contexte :

- amorçage/maintenance avant la tentative
- assemblage avant l’appel au modèle
- afterTurn ou ingestion après la tentative
- maintenance après un tour réussi
- Compaction du moteur de contexte pour les moteurs qui possèdent la Compaction

Code OpenClaw pertinent :

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Les tentatives app-server Codex exécutent actuellement des hooks génériques de
harnais d’agent et reflètent la transcription, mais n’appellent pas
`params.contextEngine.bootstrap`, `params.contextEngine.assemble`,
`params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`,
`params.contextEngine.ingest` ni `params.contextEngine.maintain`.

Code Codex pertinent :

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportement souhaité

Pour les tours du harnais Codex, OpenClaw doit préserver ce cycle de vie :

1. Lire la transcription de session OpenClaw reflétée.
2. Amorcer le moteur de contexte actif lorsqu’un fichier de session précédent existe.
3. Exécuter la maintenance d’amorçage lorsqu’elle est disponible.
4. Assembler le contexte avec le moteur de contexte actif.
5. Convertir le contexte assemblé en entrées compatibles avec Codex.
6. Démarrer ou reprendre le fil Codex avec des instructions développeur incluant tout
   `systemPromptAddition` du moteur de contexte.
7. Démarrer le tour Codex avec le prompt assemblé destiné à l’utilisateur.
8. Refléter le résultat Codex dans la transcription OpenClaw.
9. Appeler `afterTurn` s’il est implémenté, sinon `ingestBatch`/`ingest`, en utilisant
   l’instantané de transcription reflété.
10. Exécuter la maintenance de tour après les tours réussis non interrompus.
11. Préserver les signaux de Compaction natifs Codex et les hooks de Compaction OpenClaw.

## Contraintes de conception

### L’app-server Codex reste canonique pour l’état natif des fils

Codex possède son fil natif et tout historique étendu interne. OpenClaw ne doit
pas essayer de muter l’historique interne de l’app-server sauf via les appels de
protocole pris en charge.

Le miroir de transcription d’OpenClaw reste la source pour les fonctionnalités OpenClaw :

- historique de chat
- recherche
- tenue de registre de `/new` et `/reset`
- futur changement de modèle ou de harnais
- état des plugins de moteur de contexte

### L’assemblage du moteur de contexte doit être projeté dans les entrées Codex

L’interface du moteur de contexte renvoie `AgentMessage[]` OpenClaw, pas un patch
de fil Codex. L’app-server Codex `turn/start` accepte une entrée utilisateur
courante, tandis que `thread/start` et `thread/resume` acceptent des instructions
développeur.

L’implémentation nécessite donc une couche de projection. La première version sûre
doit éviter de prétendre qu’elle peut remplacer l’historique interne Codex. Elle
doit injecter le contexte assemblé comme matériau déterministe de prompt/instruction
développeur autour du tour courant.

### La stabilité du cache de prompts est importante

Pour des moteurs comme lossless-claw, le contexte assemblé doit être déterministe
pour des entrées inchangées. N’ajoutez pas d’horodatages, d’identifiants aléatoires
ni d’ordre non déterministe au texte de contexte généré.

### La sémantique de sélection à l’exécution ne change pas

La sélection du harnais reste inchangée :

- `runtime: "openclaw"` sélectionne le harnais OpenClaw intégré
- `runtime: "codex"` sélectionne le harnais Codex enregistré
- `runtime: "auto"` laisse les harnais de plugins revendiquer les fournisseurs pris en charge
- les exécutions `auto` sans correspondance utilisent le harnais OpenClaw intégré

Ce travail modifie ce qui se passe après la sélection du harnais Codex.

## Plan d’implémentation

### 1. Exporter ou déplacer les helpers réutilisables de tentative du moteur de contexte

Aujourd’hui, les helpers réutilisables de cycle de vie vivent sous l’exécuteur
d’agent intégré :

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex doit importer des helpers neutres vis-à-vis du harnais plutôt que d’atteindre
les détails d’implémentation de l’exécuteur.

Créer un module neutre vis-à-vis du harnais, par exemple :

- `src/agents/harness/context-engine-lifecycle.ts`

Déplacer ou réexporter :

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un petit wrapper autour de `runContextEngineMaintenance`

Mettre à jour les sites d’appel du harnais intégré dans la même PR.

Les noms de helpers neutres ne doivent pas mentionner le harnais intégré.

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

- Accepter les `AgentMessage[]` assemblés, l’historique reflété d’origine et le
  prompt courant.
- Déterminer quel contexte appartient aux instructions développeur plutôt qu’à
  l’entrée utilisateur courante.
- Préserver le prompt utilisateur courant comme demande finale actionable.
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

- Placer `systemPromptAddition` dans les instructions développeur.
- Placer le contexte de transcription assemblé avant le prompt courant dans `promptText`.
- L’étiqueter clairement comme contexte assemblé OpenClaw.
- Garder le prompt courant en dernier.
- Exclure le doublon du prompt utilisateur courant s’il apparaît déjà en queue.

Exemple de forme de prompt :

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

C’est moins élégant qu’une chirurgie native de l’historique Codex, mais c’est
implémentable à l’intérieur d’OpenClaw et préserve la sémantique du moteur de contexte.

Amélioration future : si l’app-server Codex expose un protocole pour remplacer ou
compléter l’historique des fils, remplacer cette couche de projection pour utiliser
cette API.

### 3. Câbler l’amorçage avant le démarrage du fil Codex

Dans `extensions/codex/src/app-server/run-attempt.ts` :

- Lire l’historique de session reflété comme aujourd’hui.
- Déterminer si le fichier de session existait avant cette exécution. Préférer un helper
  qui vérifie `fs.stat(params.sessionFile)` avant les écritures de miroir.
- Ouvrir un `SessionManager` ou utiliser un adaptateur étroit de gestionnaire de session
  si le helper l’exige.
- Appeler le helper d’amorçage neutre lorsque `params.contextEngine` existe.

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

Utiliser la même convention `sessionKey` que le pont d’outils Codex et le miroir
de transcription. Aujourd’hui, Codex calcule `sandboxSessionKey` à partir de
`params.sessionKey` ou de `params.sessionId` ; utilisez-le de manière cohérente
sauf s’il existe une raison de préserver `params.sessionKey` brut.

### 4. Câbler l’assemblage avant `thread/start` / `thread/resume` et `turn/start`

Dans `runCodexAppServerAttempt` :

1. Construire d’abord les outils dynamiques, afin que le moteur de contexte voie
   les noms d’outils réellement disponibles.
2. Lire l’historique de session reflété.
3. Exécuter `assemble(...)` du moteur de contexte lorsque `params.contextEngine` existe.
4. Projeter le résultat assemblé vers :
   - l’ajout d’instruction développeur
   - le texte de prompt pour `turn/start`

L’appel de hook existant :

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

doit devenir sensible au contexte :

1. calculer les instructions développeur de base avec `buildDeveloperInstructions(params)`
2. appliquer l’assemblage/projection du moteur de contexte
3. exécuter `before_prompt_build` avec le prompt/les instructions développeur projetés

Cet ordre permet aux hooks génériques de prompt de voir le même prompt que Codex
recevra. Si nous avons besoin d’une parité OpenClaw stricte, exécuter l’assemblage
du moteur de contexte avant la composition des hooks, car le harnais intégré applique
`systemPromptAddition` du moteur de contexte au prompt système final après son
pipeline de prompt. L’invariant important est que le moteur de contexte et les
hooks obtiennent tous deux un ordre déterministe et documenté.

Ordre recommandé pour la première implémentation :

1. `buildDeveloperInstructions(params)`
2. `assemble()` du moteur de contexte
3. ajouter/préfixer `systemPromptAddition` aux instructions développeur
4. projeter les messages assemblés dans le texte de prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. transmettre les instructions développeur finales à `startOrResumeThread(...)`
7. transmettre le texte de prompt final à `buildTurnStartParams(...)`

La spécification doit être encodée dans des tests afin que les changements futurs
ne la réordonnent pas par accident.

### 5. Préserver un formatage stable pour le cache de prompts

Le helper de projection doit produire une sortie stable au niveau des octets pour
des entrées identiques :

- ordre stable des messages
- libellés de rôles stables
- aucun horodatage généré
- aucune fuite de l’ordre des clés d’objet
- aucun délimiteur aléatoire
- aucun identifiant par exécution

Utiliser des délimiteurs fixes et des sections explicites.

### 6. Câbler l’après-tour après le miroir de transcription

Le `CodexAppServerEventProjector` de Codex construit un `messagesSnapshot` local pour le
tour actuel. `mirrorTranscriptBestEffort(...)` écrit cet instantané dans le
miroir de transcription OpenClaw.

Une fois la mise en miroir réussie ou échouée, appelez le finaliseur du moteur de contexte avec le
meilleur instantané de messages disponible:

- Préférer le contexte complet de session mis en miroir après l’écriture, car `afterTurn`
  attend l’instantané de session, pas seulement le tour actuel.
- Se rabattre sur `historyMessages + result.messagesSnapshot` si le fichier de session
  ne peut pas être rouvert.

Pseudo-flux:

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

Si la mise en miroir échoue, appelez tout de même `afterTurn` avec l’instantané de repli, mais journalisez
que le moteur de contexte ingère les données de tour de repli.

### 7. Normaliser le contexte d’exécution de l’utilisation et du cache de prompt

Les résultats Codex incluent l’utilisation normalisée issue des notifications de tokens de l’app-server quand
elle est disponible. Transmettez cette utilisation au contexte d’exécution du moteur de contexte.

Si l’app-server Codex expose finalement les détails de lecture/écriture du cache, mappez-les vers
`ContextEnginePromptCacheInfo`. Jusque-là, omettez `promptCache` plutôt que
d’inventer des zéros.

### 8. Politique de Compaction

Il existe deux systèmes de compaction:

1. `compact()` du moteur de contexte OpenClaw
2. `thread/compact/start` natif de l’app-server Codex

Ne les confondez pas silencieusement.

#### `/compact` et compaction OpenClaw explicite

Quand le moteur de contexte sélectionné a `info.ownsCompaction === true`, la compaction
OpenClaw explicite doit préférer le résultat `compact()` du moteur de contexte pour
le miroir de transcription OpenClaw et l’état du Plugin.

Quand le harnais Codex sélectionné a une liaison de thread native, nous pouvons en plus
demander une compaction native Codex pour garder le thread de l’app-server en bonne santé, mais cela
doit être signalé comme une action backend distincte dans les détails.

Comportement recommandé:

- Si `contextEngine.info.ownsCompaction === true`:
  - appeler d’abord `compact()` du moteur de contexte
  - puis appeler en meilleur effort la compaction native Codex lorsqu’une liaison de thread existe
  - renvoyer le résultat du moteur de contexte comme résultat principal
  - inclure l’état de la compaction native Codex dans `details.codexNativeCompaction`
- Si le moteur de contexte actif ne possède pas la compaction:
  - préserver le comportement actuel de compaction native Codex

Cela nécessite probablement de modifier `extensions/codex/src/app-server/compact.ts` ou
de l’envelopper depuis le chemin de compaction générique, selon l’endroit où
`maybeCompactAgentHarnessSession(...)` est invoqué.

#### Événements Codex natifs contextCompaction pendant le tour

Codex peut émettre des événements d’élément `contextCompaction` pendant un tour. Conservez l’émission
actuelle des hooks de compaction avant/après dans `event-projector.ts`, mais ne traitez pas
cela comme une compaction de moteur de contexte terminée.

Pour les moteurs qui possèdent la compaction, émettez un diagnostic explicite lorsque Codex effectue
quand même une compaction native:

- nom du flux/événement: le flux `compaction` existant est acceptable
- détails: `{ backend: "codex-app-server", ownsCompaction: true }`

Cela rend la séparation auditable.

### 9. Réinitialisation de session et comportement de liaison

Le `reset(...)` existant du harnais Codex efface la liaison de l’app-server Codex du
fichier de session OpenClaw. Préservez ce comportement.

Assurez-vous aussi que le nettoyage de l’état du moteur de contexte continue de passer par les chemins
existants du cycle de vie de session OpenClaw. N’ajoutez pas de nettoyage spécifique à Codex sauf si le
cycle de vie du moteur de contexte manque actuellement les événements reset/delete pour tous les harnais.

### 10. Gestion des erreurs

Suivez la sémantique intégrée d’OpenClaw:

- les échecs de bootstrap avertissent et continuent
- les échecs d’assemblage avertissent et se rabattent sur les messages/prompts de pipeline non assemblés
- les échecs afterTurn/ingest avertissent et marquent la finalisation post-tour comme infructueuse
- la maintenance ne s’exécute qu’après des tours réussis, non interrompus et sans yield
- les erreurs de compaction ne doivent pas être retentées comme de nouveaux prompts

Ajouts spécifiques à Codex:

- Si la projection de contexte échoue, avertir et se rabattre sur le prompt d’origine.
- Si le miroir de transcription échoue, tenter tout de même la finalisation du moteur de contexte avec
  les messages de repli.
- Si la compaction native Codex échoue après la réussite de la compaction du moteur de contexte,
  ne pas faire échouer toute la compaction OpenClaw lorsque le moteur de contexte est principal.

## Plan de test

### Tests unitaires

Ajouter des tests sous `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex appelle `bootstrap` lorsqu’un fichier de session existe.
   - Codex appelle `assemble` avec les messages mis en miroir, le budget de tokens, les noms d’outils,
     le mode de citations, l’identifiant du modèle et le prompt.
   - `systemPromptAddition` est inclus dans les instructions développeur.
   - Les messages assemblés sont projetés dans le prompt avant la requête actuelle.
   - Codex appelle `afterTurn` après la mise en miroir de la transcription.
   - Sans `afterTurn`, Codex appelle `ingestBatch` ou `ingest` par message.
   - La maintenance du tour s’exécute après les tours réussis.
   - La maintenance du tour ne s’exécute pas en cas d’erreur de prompt, d’abandon ou d’abandon yield.

2. `context-engine-projection.test.ts`
   - sortie stable pour des entrées identiques
   - aucun prompt actuel dupliqué lorsque l’historique assemblé l’inclut
   - gère un historique vide
   - préserve l’ordre des rôles
   - inclut l’ajout au prompt système uniquement dans les instructions développeur

3. `compact.context-engine.test.ts`
   - le résultat principal du moteur de contexte propriétaire gagne
   - l’état de la compaction native Codex apparaît dans les détails lorsqu’elle est aussi tentée
   - l’échec natif Codex ne fait pas échouer la compaction du moteur de contexte propriétaire
   - un moteur de contexte non propriétaire préserve le comportement actuel de compaction native

### Tests existants à mettre à jour

- `extensions/codex/src/app-server/run-attempt.test.ts` s’il existe, sinon
  les tests d’exécution de l’app-server Codex les plus proches.
- `extensions/codex/src/app-server/event-projector.test.ts` uniquement si les détails des événements de compaction
  changent.
- `src/agents/harness/selection.test.ts` ne devrait pas nécessiter de changements sauf si le comportement de configuration
  change; il doit rester stable.
- Les tests intégrés du moteur de contexte de harnais doivent continuer à réussir sans changement.

### Tests d’intégration / live

Ajouter ou étendre les smoke tests live du harnais Codex:

- configurer `plugins.slots.contextEngine` sur un moteur de test
- configurer `agents.defaults.model` sur un modèle `codex/*`
- configurer provider/model `agentRuntime.id = "codex"`
- vérifier que le moteur de test a observé:
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - maintenance

Éviter d’exiger lossless-claw dans les tests de cœur OpenClaw. Utiliser un petit Plugin de
moteur de contexte factice dans le dépôt.

## Observabilité

Ajouter des journaux de débogage autour des appels de cycle de vie du moteur de contexte Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` avec la raison
- `codex native compaction completed alongside context-engine compaction`

Éviter de journaliser les prompts complets ou le contenu des transcriptions.

Ajouter des champs structurés lorsque c’est utile:

- `sessionId`
- `sessionKey` masqué ou omis selon la pratique de journalisation existante
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibilité

Cela doit être rétrocompatible:

- Si aucun moteur de contexte n’est configuré, le comportement du moteur de contexte hérité doit être
  équivalent au comportement actuel du harnais Codex.
- Si `assemble` du moteur de contexte échoue, Codex doit continuer avec le chemin de
  prompt d’origine.
- Les liaisons de thread Codex existantes doivent rester valides.
- L’empreinte dynamique des outils ne doit pas inclure la sortie du moteur de contexte; sinon
  chaque changement de contexte pourrait forcer un nouveau thread Codex. Seul le catalogue d’outils
  doit affecter l’empreinte dynamique des outils.

## Questions ouvertes

1. Le contexte assemblé doit-il être injecté entièrement dans le prompt utilisateur, entièrement
   dans les instructions développeur, ou partagé?

   Recommandation: partagé. Mettre `systemPromptAddition` dans les instructions développeur;
   mettre le contexte de transcription assemblé dans l’enveloppe de prompt utilisateur. Cela correspond le mieux
   au protocole Codex actuel sans modifier l’historique de thread natif.

2. La compaction native Codex doit-elle être désactivée quand un moteur de contexte possède
   la compaction?

   Recommandation: non, pas au départ. La compaction native Codex peut encore être
   nécessaire pour garder le thread de l’app-server vivant. Mais elle doit être signalée comme
   compaction native Codex, pas comme compaction de moteur de contexte.

3. `before_prompt_build` doit-il s’exécuter avant ou après l’assemblage du moteur de contexte?

   Recommandation: après la projection du moteur de contexte pour Codex, afin que les hooks de harnais
   génériques voient le prompt/les instructions développeur réels que Codex recevra. Si
   la parité avec le harnais intégré exige l’inverse, encoder l’ordre choisi dans
   les tests et le documenter ici.

4. L’app-server Codex peut-il accepter une future surcharge structurée de contexte/historique?

   Inconnu. Si c’est possible, remplacer la couche de projection textuelle par ce protocole et
   conserver les appels de cycle de vie inchangés.

## Critères d’acceptation

- Un tour de harnais intégré `codex/*` invoque le cycle de vie assemble du moteur de contexte
  sélectionné.
- Un `systemPromptAddition` du moteur de contexte affecte les instructions développeur Codex.
- Le contexte assemblé affecte l’entrée du tour Codex de façon déterministe.
- Les tours Codex réussis appellent `afterTurn` ou le repli ingest.
- Les tours Codex réussis exécutent la maintenance de tour du moteur de contexte.
- Les tours échoués/abandonnés/abandonnés avec yield n’exécutent pas la maintenance de tour.
- La compaction possédée par le moteur de contexte reste principale pour l’état OpenClaw/Plugin.
- La compaction native Codex reste auditable comme comportement Codex natif.
- Le comportement existant du moteur de contexte de harnais intégré est inchangé.
- Le comportement existant du harnais Codex est inchangé quand aucun moteur de contexte non hérité
  n’est sélectionné ou quand l’assemblage échoue.
