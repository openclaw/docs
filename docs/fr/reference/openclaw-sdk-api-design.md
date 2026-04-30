---
read_when:
    - Vous implémentez le SDK public proposé pour les applications OpenClaw
    - Vous avez besoin du namespace, de l’événement, du résultat, de l’artefact, de l’approbation ou du contrat de sécurité provisoire pour le SDK d’application
    - Vous comparez les ressources du protocole Gateway avec l’enveloppe de haut niveau du SDK d’application OpenClaw
sidebarTitle: App SDK API design
summary: Conception de référence pour l’API publique du SDK d’application OpenClaw, la taxonomie des événements, les artefacts, les approbations et la structure des paquets
title: Conception de l’API du SDK d’application OpenClaw
x-i18n:
    generated_at: "2026-04-30T07:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Cette page est la conception de référence API détaillée pour le
[SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) public. Elle est volontairement séparée du
[Plugin SDK](/fr/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` est le package externe d’application/client pour communiquer avec le
  Gateway. `openclaw/plugin-sdk/*` est le contrat de création de plugins en processus.
  N’importez pas de sous-chemins du Plugin SDK depuis des apps qui ont seulement besoin d’exécuter des agents.
</Note>

Le SDK d’application public doit être construit en deux couches :

1. Un client Gateway généré de bas niveau.
2. Un wrapper ergonomique de haut niveau avec des objets `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` et `Environment`.

## Conception des espaces de noms

Les espaces de noms de bas niveau doivent suivre de près les ressources du Gateway :

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Les wrappers de haut niveau doivent renvoyer des objets qui rendent les flux courants agréables :

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Contrat d’événements

Le SDK public doit exposer des événements versionnés, rejouables et normalisés.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` est un curseur de relecture. Les consommateurs doivent pouvoir se reconnecter avec
`events({ after: id })` et recevoir les événements manqués lorsque la rétention le permet.

Familles d’événements normalisées recommandées :

| Événement             | Signification                                                |
| --------------------- | ------------------------------------------------------------ |
| `run.created`         | Run acceptée.                                                |
| `run.queued`          | La run attend une voie de session, un runtime ou un environnement. |
| `run.started`         | Le runtime a commencé l’exécution.                           |
| `run.completed`       | La run s’est terminée avec succès.                           |
| `run.failed`          | La run s’est terminée avec une erreur.                       |
| `run.cancelled`       | La run a été annulée.                                        |
| `run.timed_out`       | La run a dépassé son délai d’expiration.                     |
| `assistant.delta`     | Delta de texte de l’assistant.                               |
| `assistant.message`   | Message complet de l’assistant ou remplacement.              |
| `thinking.delta`      | Delta de raisonnement ou de plan, lorsque la politique autorise l’exposition. |
| `tool.call.started`   | L’appel d’outil a commencé.                                  |
| `tool.call.delta`     | L’appel d’outil a diffusé une progression ou une sortie partielle. |
| `tool.call.completed` | L’appel d’outil a réussi.                                    |
| `tool.call.failed`    | L’appel d’outil a échoué.                                    |
| `approval.requested`  | Une run ou un outil nécessite une approbation.               |
| `approval.resolved`   | L’approbation a été accordée, refusée, expirée ou annulée.   |
| `question.requested`  | Le runtime demande une entrée à l’utilisateur ou à l’app hôte. |
| `question.answered`   | L’app hôte a fourni une réponse.                             |
| `artifact.created`    | Nouvel artefact disponible.                                  |
| `artifact.updated`    | Un artefact existant a changé.                               |
| `session.created`     | Session créée.                                               |
| `session.updated`     | Les métadonnées de session ont changé.                       |
| `session.compacted`   | Une Compaction de session a eu lieu.                         |
| `task.updated`        | L’état d’une tâche en arrière-plan a changé.                 |
| `git.branch`          | Le runtime a observé ou modifié l’état de branche.           |
| `git.diff`            | Le runtime a produit ou modifié un diff.                     |
| `git.pr`              | Le runtime a ouvert, mis à jour ou lié une pull request.     |

Les payloads natifs du runtime doivent être disponibles via `raw`, mais les apps ne doivent pas
avoir à analyser `raw` pour une UI normale.

## Contrat de résultat

`Run.wait()` doit renvoyer une enveloppe de résultat stable :

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Le résultat doit être simple et stable. Les valeurs d’horodatage préservent la forme du Gateway,
si bien que les runs actuelles adossées au cycle de vie signalent généralement des nombres en
millisecondes depuis l’époque Unix, tandis que les adaptateurs peuvent encore exposer des chaînes ISO. L’UI riche, les traces d’outils et
les détails natifs du runtime appartiennent aux événements et aux artefacts.

`accepted` est un résultat d’attente non terminal : cela signifie que l’échéance d’attente du Gateway
a expiré avant que la run produise une fin ou une erreur de cycle de vie. Il ne doit pas être traité comme
`timed_out` ; `timed_out` est réservé à une run qui a dépassé son propre délai d’expiration
runtime.

## Approbations et questions

Les approbations doivent être des objets de premier ordre, car les agents de codage franchissent constamment des limites de sécurité.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Les événements d’approbation doivent porter :

- l’identifiant d’approbation
- l’identifiant de run et l’identifiant de session
- le type de demande
- le résumé de l’action demandée
- le nom de l’outil ou l’action d’environnement
- le niveau de risque
- les décisions disponibles
- l’expiration
- si la décision peut être réutilisée

Les questions sont séparées des approbations. Une question demande des informations à l’utilisateur ou à l’app hôte. Une approbation demande l’autorisation d’effectuer une action.

## Modèle ToolSpace

Les apps doivent comprendre la surface d’outils sans importer les éléments internes des plugins.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

Le SDK doit exposer :

- les métadonnées d’outil normalisées
- source : OpenClaw, MCP, plugin, channel, runtime ou app
- le résumé de schéma
- la politique d’approbation
- la compatibilité runtime
- si un outil est masqué, en lecture seule, capable d’écrire ou capable d’agir comme hôte

L’invocation d’outils via le SDK doit être explicite et limitée à un périmètre. La plupart des apps doivent
exécuter des agents, pas appeler directement des outils arbitraires.

## Modèle d’artefact

Les artefacts doivent couvrir plus que les fichiers.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Exemples courants :

- modifications de fichiers et fichiers générés
- bundles de patch
- diffs VCS
- captures d’écran et sorties média
- journaux et bundles de traces
- liens de pull request
- trajectoires runtime
- instantanés d’espaces de travail d’environnements gérés

L’accès aux artefacts doit prendre en charge la caviardisation, la rétention et les URL de téléchargement sans
supposer que chaque artefact est un fichier local normal.

## Modèle de sécurité

Le SDK d’app doit être explicite sur l’autorité.

Portées de jeton recommandées :

| Portée              | Autorise                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Lister et inspecter les agents.                      |
| `agent.run`         | Démarrer des runs.                                   |
| `session.read`      | Lire les métadonnées et messages de session.         |
| `session.write`     | Créer, envoyer vers, forker, compacter et interrompre des sessions. |
| `task.read`         | Lire l’état des tâches en arrière-plan.              |
| `task.write`        | Annuler ou modifier la politique de notification des tâches. |
| `approval.respond`  | Approuver ou refuser des demandes.                   |
| `tools.invoke`      | Invoquer directement les outils exposés.             |
| `artifacts.read`    | Lister et télécharger des artefacts.                 |
| `environment.write` | Créer ou détruire des environnements gérés.          |
| `admin`             | Opérations administratives.                          |

Valeurs par défaut :

- aucune transmission de secrets par défaut
- aucun relais sans restriction des variables d’environnement
- références de secrets au lieu de valeurs de secrets
- politique de bac à sable et réseau explicite
- rétention explicite des environnements distants
- approbations pour l’exécution hôte sauf si la politique prouve le contraire
- événements runtime bruts caviardés avant de quitter le Gateway, sauf si l’appelant dispose d’une
  portée de diagnostic plus forte

## Fournisseur d’environnement géré

Les agents gérés doivent être implémentés comme des fournisseurs d’environnement.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

La première implémentation n’a pas besoin d’être un SaaS hébergé. Elle peut cibler
des hôtes Node existants, des espaces de travail éphémères, des runners de style CI ou des
environnements de style Testbox. Le contrat important est :

1. préparer l’espace de travail
2. lier un environnement sûr et les secrets
3. démarrer la run
4. diffuser les événements
5. collecter les artefacts
6. nettoyer ou conserver selon la politique

Une fois ce contrat stable, un service cloud hébergé peut implémenter le même contrat de
fournisseur.

## Structure des packages

Packages recommandés :

| Package                 | Objectif                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK public de haut niveau et client Gateway généré de bas niveau. |
| `@openclaw/sdk-react`   | Hooks React facultatifs pour tableaux de bord et créateurs d’apps. |
| `@openclaw/sdk-testing` | Assistants de test et faux serveur Gateway pour intégrations d’apps. |

Le dépôt dispose déjà de `openclaw/plugin-sdk/*` pour les plugins. Gardez cet espace de noms
séparé afin d’éviter de confondre les auteurs de plugins et les développeurs d’apps.

## Stratégie de client généré

Le client bas niveau doit être généré à partir des schémas versionnés du protocole Gateway,
puis encapsulé dans des classes ergonomiques écrites à la main.

Superposition :

1. Source de vérité du schéma Gateway.
2. Client TypeScript bas niveau généré.
3. Validateurs d’exécution pour les entrées externes et les charges utiles d’événements.
4. Wrappers haut niveau `OpenClaw`, `Agent`, `Session`, `Run`, `Task` et `Artifact`.
5. Exemples de cookbook et tests d’intégration.

Avantages :

- la dérive du protocole est visible
- les tests peuvent comparer les méthodes générées avec les exports Gateway
- l’App SDK reste indépendant des composants internes du Plugin SDK
- les consommateurs bas niveau conservent un accès complet au protocole
- les consommateurs haut niveau obtiennent la petite API produit

## Docs associées

- [OpenClaw App SDK](/fr/concepts/openclaw-sdk)
- [Référence RPC Gateway](/fr/reference/rpc)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Tâches en arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Aperçu du Plugin SDK](/fr/plugins/sdk-overview)
