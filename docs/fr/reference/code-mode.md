---
read_when:
    - Vous souhaitez activer le mode code d’OpenClaw pour l’exécution d’un agent
    - Vous devez expliquer en quoi le mode code diffère du mode Code de Codex
    - Vous examinez le contrat d’outil compact, le bac à sable QuickJS-WASI, la transformation TypeScript ou la passerelle masquée vers le catalogue d’outils
    - Vous ajoutez ou examinez une intégration interne du registre d’espaces de noms en mode code
sidebarTitle: Code mode
summary: 'Mode code d’OpenClaw : une surface d’outils compacte activable, reposant sur QuickJS-WASI et un catalogue d’outils masqué limité à l’exécution'
title: Mode code
x-i18n:
    generated_at: "2026-07-12T15:57:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

Le mode code est une fonctionnalité expérimentale et facultative du runtime d’agent OpenClaw. Lorsqu’il est
activé, le modèle ne voit plus le schéma de chaque outil activé ; il voit à la
place `exec`, `wait` et tout outil accessible uniquement en mode direct dont le résultat structuré ne peut pas traverser
la passerelle invitée limitée au JSON. Le modèle écrit un petit programme JavaScript ou TypeScript
qui recherche, décrit et appelle le catalogue d’outils masqué.

Cette page documente le mode code d’OpenClaw, et non Codex Code Mode. Les deux fonctionnalités
partagent un nom et les mêmes noms d’outils de contrôle (`exec`, `wait`), mais ce sont
des implémentations distinctes :

- Codex Code Mode s’exécute dans le harnais de codage Codex. Son outil `exec` est un
  outil à grammaire libre : le modèle écrit du code source JavaScript brut (éventuellement
  précédé d’une ligne de pragma `// @exec: {...}` pour les options d’exécution), exécuté
  dans un runtime Deno/V8.
- Le mode code d’OpenClaw s’exécute dans le runtime d’agent OpenClaw générique et reste
  désactivé sauf si `tools.codeMode.enabled: true` est configuré. Son outil `exec`
  reçoit une charge utile JSON `{ code, language }`, exécutée dans un worker QuickJS-WASI.

Les deux sont des surfaces d’exécution JavaScript, et non des surfaces de commandes shell. Considérez-les
comme des fonctionnalités indépendantes, implémentées différemment, qui exposent par coïncidence
des outils `exec`/`wait` portant le même nom.

## Fonctionnement

- La liste des outils visibles par le modèle devient `exec`, `wait`, ainsi que tout outil accessible uniquement en mode direct
  tel que `computer`, dont le résultat sous forme d’image ne peut pas traverser la passerelle invitée.
- `exec` évalue le JavaScript ou le TypeScript généré par le modèle dans un thread de worker
  QuickJS-WASI isolé.
- Chaque outil activé admissible au catalogue (cœur d’OpenClaw, plugin, MCP, client) est masqué dans
  l’invite du modèle et exposé dans le programme invité via `ALL_TOOLS`
  et `tools`.
- Le code invité recherche dans le catalogue masqué, décrit le schéma d’un outil et appelle
  un outil par le même chemin d’exécution que celui utilisé par les tours d’agent normaux (politique,
  approbations, hooks et télémétrie continuent de s’appliquer).
- Les outils MCP sont regroupés dans l’espace de noms `MCP` ; en mode code, il s’agit de la
  seule manière prise en charge de les appeler.
- `wait` reprend une exécution suspendue en mode code lorsque des appels d’outils imbriqués sont encore
  en attente.

Le mode code modifie uniquement la surface d’orchestration présentée au modèle. Il ne
remplace pas les outils, les outils de plugin, les outils MCP, l’authentification, la politique d’approbation, le comportement
des canaux ni la sélection du modèle.

## Pourquoi l’utiliser

- Surface d’invite réduite : les fournisseurs reçoivent deux outils de contrôle et seulement les quelques
  outils directs requis, au lieu de dizaines ou de centaines de schémas d’outils complets.
- Meilleure orchestration : le modèle peut utiliser des boucles, des jointures, de petites transformations,
  une logique conditionnelle et des appels d’outils imbriqués parallèles dans une même cellule de code.
- Indépendant du fournisseur : fonctionne avec les outils OpenClaw, de plugin, MCP et client sans
  dépendre de l’exécution de code native du fournisseur.
- Échec sécurisé : si le mode code est activé, mais que le runtime QuickJS-WASI est
  indisponible, l’exécution échoue au lieu de revenir silencieusement à une exposition directe
  étendue des outils.

Il est particulièrement utile pour les agents disposant d’un vaste catalogue d’outils activés, ou pour les workflows dans lesquels
le modèle doit rechercher, combiner et appeler plusieurs outils avant de répondre.

## Activation

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Forme abrégée :

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Le mode code reste désactivé lorsque `tools.codeMode` est omis, vaut `false` ou est un objet
sans `enabled: true`.

Si vous utilisez des agents en bac à sable avec des serveurs MCP configurés, autorisez également le
plugin MCP intégré dans la politique d’outils du bac à sable, par exemple
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Consultez
[Configuration — outils et fournisseurs personnalisés](/fr/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Définissez des limites explicites pour imposer des bornes plus strictes :

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Pour confirmer la forme de la charge utile du modèle pendant le débogage, exécutez le Gateway avec une
journalisation ciblée :

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Lorsque le mode code est actif, les noms d’outils présentés au modèle dans les journaux doivent être `exec` et
`wait`. Pour obtenir la charge utile complète et expurgée du fournisseur, ajoutez
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` pendant une courte session de débogage.

## Présentation technique

Le reste de cette page couvre le contrat du runtime et les détails d’implémentation,
à destination des responsables de maintenance, des auteurs de plugins qui déboguent l’exposition des outils et des opérateurs
qui valident des déploiements à haut risque.

## État du runtime

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| État par défaut     | désactivé                                                                                   |
| Stabilité           | surface OpenClaw expérimentale (Codex Code Mode est une surface distincte et stable du harnais Codex) |
| Surface cible       | exécutions génériques d’agents OpenClaw                                                     |
| Posture de sécurité | le code du modèle est hostile                                                               |
| Garantie utilisateur | l’activation du mode code ne revient jamais silencieusement à une exposition directe étendue des outils |

## Périmètre

Le mode code gère la forme de l’orchestration présentée au modèle pour une exécution préparée. Il
ne gère pas la sélection du modèle, le comportement des canaux, l’authentification, la politique des outils ni les
implémentations d’outils.

Dans le périmètre : définitions des outils de contrôle/directs visibles par le modèle, construction du catalogue
d’outils masqué, exécution invitée JavaScript/TypeScript, runtime de worker
QuickJS-WASI, rappels de l’hôte pour rechercher/décrire/appeler, état reprenable pour les
programmes invités suspendus, limites de sortie/délai d’expiration/mémoire/appels en attente/instantanés,
ainsi que projection de la télémétrie et de la trajectoire pour les appels d’outils imbriqués.

Hors périmètre : exécution distante de code native du fournisseur, sémantique d’exécution
du shell, modification de l’autorisation existante des outils, scripts persistants écrits par l’utilisateur,
accès au gestionnaire de paquets, aux fichiers, au réseau ou aux modules dans le code invité, et réutilisation
directe des composants internes de Codex Code Mode.

Les outils gérés par le fournisseur, tels que les bacs à sable Python distants, sont des outils distincts. Consultez
[Exécution de code](/fr/tools/code-execution).

## Termes

- **Mode code** : mode du runtime OpenClaw qui masque les outils de modèle compatibles avec le catalogue
  et expose `exec`, `wait`, ainsi que les outils requis accessibles uniquement en mode direct.
- **Runtime invité** : machine virtuelle JavaScript QuickJS-WASI qui évalue le code du modèle.
- **Passerelle hôte** : surface étroite de rappels compatibles avec JSON, du code invité
  vers OpenClaw.
- **Catalogue** : liste propre à l’exécution des outils effectifs après l’application normale de la politique
  des outils et la résolution des plugins, des outils MCP et des outils client.
- **Appel d’outil imbriqué** : appel d’outil effectué depuis le code invité via la passerelle
  hôte.
- **Instantané** : état sérialisé de la machine virtuelle QuickJS-WASI enregistré afin que `wait` puisse poursuivre
  une exécution suspendue en mode code.

## Configuration

`tools.codeMode.enabled` est le mécanisme d’activation ; la définition d’autres champs
n’active pas la fonctionnalité à elle seule.

| Champ                 | Valeur par défaut              | Limite                                          |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | booléen ; seul `true` active le mode code        |
| `runtime`             | `"quickjs-wasi"`               | seule valeur prise en charge                    |
| `mode`                | `"only"`                       | expose les outils de contrôle/directs et catalogue les autres |
| `languages`           | `["javascript", "typescript"]` | tout sous-ensemble de ces deux valeurs           |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | limité à `maxSearchLimit`                       |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Si le mode code est activé, mais que QuickJS-WASI ne peut pas être chargé, OpenClaw échoue de manière sécurisée
pour cette exécution ; il n’expose pas silencieusement les outils normaux en guise de solution de repli.

## Activation

Le mode code est évalué une fois que la politique d’outils effective est connue et avant
l’assemblage de la requête finale au modèle :

1. Résoudre l’agent, le modèle, le fournisseur, le bac à sable, le canal, l’expéditeur et la politique
   d’exécution.
2. Construire la liste effective des outils OpenClaw, en ajoutant les outils de plugin, MCP et
   client admissibles.
3. Appliquer la politique d’autorisation/de refus.
4. Si `tools.codeMode.enabled` vaut false, poursuivre avec l’exposition normale des outils.
5. S’il est activé et que les outils sont actifs pour l’exécution, conserver les outils requis accessibles uniquement
   en mode direct et enregistrer chaque outil effectif admissible au catalogue dans le catalogue
   du mode code.
6. Retirer les outils catalogués de la liste visible par le modèle ; ajouter `exec` et
   `wait` aux outils accessibles uniquement en mode direct conservés.

Les exécutions intentionnellement dépourvues d’outils (appels bruts au modèle, `disableTools: true`
ou liste `tools.allow` vide) n’activent pas la surface du mode code, même
si `tools.codeMode.enabled: true` est configuré. Le mode code et OpenClaw Tool
Search sont mutuellement exclusifs pour une exécution ; si le mode code s’active, la
Compaction de Tool Search ne s’applique pas.

Le catalogue du mode code est propre à l’exécution et ne doit pas divulguer les outils d’un autre
agent, d’une autre session, d’un autre expéditeur ou d’une autre exécution.

## Outils visibles par le modèle

Lorsque le mode code est actif, le modèle voit `exec`, `wait` et tout outil requis
accessible uniquement en mode direct. Tous les autres outils activés sont masqués dans la liste d’outils
présentée au modèle et enregistrés dans le catalogue du mode code.

Utilisez `exec` pour orchestrer les outils, joindre les données, créer des boucles, effectuer des appels imbriqués parallèles
et réaliser des transformations structurées. Utilisez `wait` uniquement lorsque `exec` renvoie un résultat `waiting`
reprenable.

## `exec`

`exec` démarre une cellule en mode code et renvoie un résultat. Le code d’entrée est généré
par le modèle et doit être considéré comme hostile.

Entrée :

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Règles :

- L’un des champs `code` ou `command` doit être non vide.
- `code` est le champ documenté présenté au modèle.
- `command` est accepté comme alias compatible avec exec pour les politiques de hooks et les
  réécritures approuvées (l’outil shell exec normal d’OpenClaw utilise également un champ `command`) ;
  lorsque les deux sont présents, les valeurs doivent correspondre.
- `language` vaut `"javascript"` par défaut ; le schéma l’expose comme une énumération de chaînes
  simple (`"javascript" | "typescript"`), et non comme une union `oneOf`/`anyOf`,
  car certains fournisseurs rejettent ces formes.
- Si `language` vaut `"typescript"`, OpenClaw effectue la transpilation avant l’évaluation.
- `exec` rejette `import`, `require`, l’importation dynamique et les motifs de chargeur
  de modules.
- `exec` n’expose jamais récursivement l’implémentation shell normale de `exec`.
- Les événements de hook `exec` externes du mode code contiennent `toolKind: "code_mode_exec"` et
  `toolInputKind: "javascript" | "typescript"` (lorsqu’il est connu), afin que les politiques puissent
  distinguer les cellules du mode code des appels `exec` de type shell qui partagent le
  même nom d’outil.

Résultat :

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` renvoie `waiting` lorsque la VM QuickJS est suspendue avec un état pouvant être repris qui
nécessite encore une continuation visible par le modèle ; le résultat inclut un `runId` pour
`wait`. Les appels de pont d’espace de noms, y compris les appels d’espace de noms MCP, sont automatiquement traités
dans le même appel `exec`/`wait` tant qu’ils sont prêts, de sorte qu’un bloc de code
compact peut appeler un outil MCP sans imposer un appel d’outil du modèle par attente
d’espace de noms.

`exec` renvoie `completed` uniquement lorsque la VM invitée n’a plus aucun travail en attente et que la
valeur finale est compatible avec JSON après l’exécution de l’adaptateur de sortie d’OpenClaw.

## `wait`

`wait` poursuit l’exécution d’une VM en mode code suspendue.

Entrée :

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La sortie est la même union `CodeModeResult` que celle renvoyée par `exec`.

`wait` existe parce que les outils OpenClaw imbriqués peuvent être lents, interactifs, soumis à
approbation ou diffuser des mises à jour partielles ; le modèle ne devrait pas avoir à maintenir ouvert un long
appel `exec` pendant que l’hôte attend un travail externe.

La capture/restauration d’instantané QuickJS-WASI constitue le mécanisme de reprise :

1. `exec` évalue le code jusqu’à son achèvement, son échec ou sa suspension.
2. Lors d’une suspension, OpenClaw crée un instantané de la VM QuickJS et enregistre le travail
   en attente sur l’hôte.
3. Lorsque le travail en attente se termine, `wait` restaure l’instantané de la VM et
   réenregistre les rappels de l’hôte à l’aide de noms stables.
4. OpenClaw transmet les résultats des outils imbriqués à la VM restaurée et traite
   les tâches QuickJS en attente.
5. `wait` renvoie `completed`, `failed` ou un autre résultat `waiting`.

Les instantanés constituent un état d’exécution, et non des artefacts utilisateur : ils résident uniquement dans une
table en mémoire propre au processus (sans écriture en base de données ni sur disque), leur taille est limitée, ils expirent et sont
limités à l’exécution et à la session qui les ont créés.

`wait` échoue (avec un résultat `failed`) lorsque :

- `runId` est inconnu ou que son instantané a déjà expiré.
- l’appelant ne se trouve pas dans la même portée d’exécution/session que l’exécution suspendue.
- un appel `wait` est déjà en cours pour ce `runId`.
- la restauration QuickJS-WASI échoue.
- la reprise dépasserait `maxOutputBytes` ou `maxSnapshotBytes`.

## API d’exécution invitée

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` contient des métadonnées compactes pour le catalogue limité à l’exécution ; il ne
contient pas les schémas complets par défaut.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

Les outils de Plugin utilisent `source: "openclaw"` avec `sourceName` défini sur l’identifiant du
Plugin propriétaire ; il n’existe aucune valeur source `"plugin"` distincte. `source: "mcp"` est
utilisé uniquement pour les entrées MCP dans les métadonnées `sourceName`/`mcp` (et est exclu
de `ALL_TOOLS`/`tools.*` par filtrage, voir ci-dessous).

Le schéma complet est chargé uniquement à la demande :

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Assistants de catalogue :

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Les fonctions d’outil pratiques sont installées uniquement pour les noms sûrs non ambigus :

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Les entrées du catalogue MCP ne peuvent pas être appelées via `tools.call(...)` ni par des fonctions
pratiques en mode code ; elles sont exposées uniquement par l’espace de noms `MCP`
généré. Des fichiers de déclaration de style TypeScript sont disponibles via la
surface de fichiers virtuels `API` en lecture seule, afin que les agents puissent examiner les signatures MCP
sans ajouter les schémas MCP au prompt :

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` renvoie des déclarations compactes déduites des
métadonnées d’outil MCP :

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Les fichiers de déclaration sont virtuels et ne sont pas écrits dans l’espace de travail ni dans le
répertoire d’état. Pour chaque appel `exec` en mode code, OpenClaw construit le catalogue d’outils
limité à l’exécution, conserve les entrées MCP visibles, génère `mcp/index.d.ts` ainsi qu’un
fichier `mcp/<server>.d.ts` par serveur visible, puis injecte cette petite table en lecture seule
dans le processus de travail QuickJS. Le code invité ne voit que l’objet `API` :
`API.list(prefix?)` renvoie les métadonnées des fichiers et `API.read(path)` renvoie le
contenu de déclaration sélectionné. Les chemins inconnus et les segments `.`/`..` sont
rejetés.

Cela maintient les schémas MCP volumineux hors du prompt du modèle : l’agent apprend que
l’API virtuelle existe grâce à la description de l’outil `exec`, lit uniquement le
fichier de déclaration nécessaire, puis appelle `MCP.<server>.<tool>()` avec un seul argument objet.
`MCP.<server>.$api()` reste disponible comme solution de repli intégrée pour une
réponse de schéma portant sur un seul outil au sein du programme.

L’environnement d’exécution invité ne voit jamais directement les objets de l’hôte. Les entrées et sorties traversent
le pont sous forme de valeurs compatibles avec JSON, avec des limites de taille explicites.

## Espaces de noms internes

Les espaces de noms internes fournissent au mode code une API de domaine concise sans ajouter davantage
d’outils visibles par le modèle. Une intégration appartenant au chargeur enregistre un espace de noms tel que
`Issues` ou `Calendar` ; le code invité appelle ensuite cet espace de noms dans le
programme QuickJS tandis que le modèle continue de voir la surface compacte de contrôle directe.

Pour le moment, les espaces de noms sont internes. Il n’existe aucune API publique d’espace de noms dans le SDK de Plugin :
les espaces de noms de Plugins externes nécessitent un contrat appartenant au chargeur afin que l’identité du Plugin,
les manifestes installés, l’état d’authentification et les descripteurs de catalogue mis en cache ne puissent pas diverger
des outils du Plugin qui sous-tendent l’espace de noms. Le mode code du cœur ne possède que le
bac à sable, la sérialisation, le filtrage du catalogue et la répartition du pont.

Le code invité peut utiliser soit la variable globale directe, soit la table `namespaces` :

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Cycle de vie du registre

Le registre des espaces de noms est propre au processus et indexé par l’identifiant de l’espace de noms :

1. Un chargeur de confiance appelle `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Le mode code crée le `ToolSearchRuntime` masqué pour l’exécution et lit son
   catalogue limité à l’exécution.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserve uniquement les enregistrements
   dont tous les `requiredToolNames` sont visibles et appartiennent au même `pluginId`.
4. Chaque espace de noms visible appelle `createScope(ctx)` pour l’exécution actuelle et
   reçoit le contexte d’exécution, notamment `agentId`, `sessionKey`, `sessionId`,
   `runId`, la configuration et l’état d’abandon.
5. Les données de portée sont sérialisées dans un descripteur simple et injectées dans QuickJS
   sous forme de variables globales directes et de `namespaces.<globalName>`.
6. Les appels invités sont suspendus via le pont du processus de travail, résolvent le chemin de l’espace de noms
   sur l’hôte, associent l’appel à un outil de catalogue déclaré appartenant au Plugin et
   exécutent cet outil via `ToolSearchRuntime.callExactId`.
7. Les appels de pont d’espace de noms prêts sont automatiquement traités dans l’appel
   `exec`/`wait` actif ; si le travail de l’espace de noms est toujours en attente à l’expiration du délai ou
   si l’invité cède explicitement le contrôle, `wait` reprend ultérieurement le même environnement d’exécution
   d’espace de noms.
8. L’annulation ou la désinstallation d’un Plugin appelle
   `clearCodeModeNamespacesForPlugin(pluginId)` afin que les variables globales obsolètes ne
   survivent pas à l’échec du chargement d’un Plugin.

Les appels d’espace de noms sont des appels d’outils du catalogue : ils utilisent les mêmes hooks de politique,
approbations, gestion de l’abandon, télémétrie, projection de transcription et
comportement de suspension/reprise que `tools.call(...)`.

### Structure d’enregistrement

Enregistrez les espaces de noms depuis l’intégration qui possède les outils sous-jacents. Limitez
la portée et exposez uniquement les verbes de domaine qui correspondent à des outils de catalogue
déclarés.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` marque un membre de portée comme une
fonction d’espace de noms appelable. Le paramètre facultatif `inputMapper` reçoit les arguments
invités et renvoie l’objet d’entrée destiné à l’outil de catalogue sous-jacent ; sans
celui-ci, le premier argument invité est utilisé, ou `{}` s’il est omis.

Les fonctions brutes de l’hôte sont rejetées avant l’exécution du code invité :

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Propriété et visibilité

La propriété de l’espace de noms est liée au `pluginId` de l’appelant qui effectue l’enregistrement.
`requiredToolNames` constitue à la fois un contrôle de visibilité et une vérification de propriété :

- chaque outil requis doit exister dans le catalogue de l’exécution
- chaque outil requis doit avoir `sourceName === pluginId`
- l’espace de noms est masqué lorsqu’un outil requis est absent ou appartient à
  un autre Plugin
- chaque chemin appelable ne peut cibler qu’un outil nommé dans `requiredToolNames`

Cela empêche un autre Plugin d’exposer un espace de noms en enregistrant un
outil portant le même nom et maintient les espaces de noms alignés avec la politique ordinaire de l’agent : si
l’exécution ne peut pas voir les outils sous-jacents, elle ne peut pas voir l’espace de noms.

Par exemple, un espace de noms GitHub devrait être placé derrière un Plugin appartenant à GitHub qui
gère l’authentification GitHub, les clients REST/GraphQL, les limites de débit, les approbations
d’écriture et les tests. Le mode code du cœur ne devrait pas intégrer d’API propres à GitHub, de gestion
des jetons ni de politique de fournisseur.

### Règles de sérialisation de la portée

`createScope(ctx)` peut renvoyer un objet simple contenant des valeurs compatibles avec
JSON, des tableaux, des objets imbriqués et des marqueurs d’appel
`createCodeModeNamespaceTool(...)`. Les objets de l’hôte n’entrent jamais directement dans QuickJS.

Le sérialiseur rejette :

- fonctions brutes
- graphes d’objets circulaires
- segments de chemin non sûrs : `__proto__`, `constructor`, `prototype`, clés vides,
  ou clés contenant le séparateur de chemin interne
- valeurs `globalName` qui ne sont pas des identifiants JavaScript
- collisions de `globalName` avec des variables globales intégrées du mode code telles que `tools`,
  `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS` ou
  `__openclaw*`

Les valeurs qui ne peuvent pas être sérialisées en JSON sont converties en valeurs
de repli compatibles avec JSON avant de traverser le pont. Les données binaires, les handles, les sockets, les clients et
les instances de classe doivent rester derrière les outils ordinaires du catalogue.

### Prompts

La `description` de l’espace de noms et le `prompt` facultatif sont ajoutés au schéma
`exec` visible par le modèle uniquement lorsque l’espace de noms est visible pour cette exécution. Utilisez-les
pour présenter la surface utile minimale :

```typescript
{
  description: "Assistants du service de production de fictions.",
  prompt:
    "Utilisez Fictions.riskAudit(), Fictions.promoteIfReady(id, status) et Fictions.unpaidOver(amount).",
}
```

Limitez les prompts au contrat de l’espace de noms, et non à la configuration de l’authentification, à l’historique
de l’implémentation ou au comportement sans rapport du plugin.

### Nettoyage

Les espaces de noms sont des enregistrements locaux au processus. Supprimez-les lorsque le
plugin propriétaire est désactivé, désinstallé ou restauré à une version antérieure :

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Le nettoyage du mode code appartient au plugin ; effacez les enregistrements d’espace de noms du plugin
à la fin de son cycle de vie au lieu de conserver des handles de démantèlement par espace de noms.
Les tests peuvent appeler `clearCodeModeNamespacesForTest()` afin d’éviter les fuites
d’enregistrements entre les cas.

### Liste de contrôle des tests

Les modifications d’espace de noms doivent couvrir la frontière de sécurité et le comportement du code invité :

- le texte du prompt de l’espace de noms apparaît uniquement lorsque les outils sous-jacents sont visibles
- les outils de même nom provenant d’un autre `sourceName` n’exposent pas l’espace de noms
- les fonctions de portée brutes sont rejetées
- les identifiants d’espace de noms falsifiés et les chemins falsifiés sont rejetés
- les chemins appelables ne peuvent pas cibler des outils non déclarés
- les objets imbriqués et les références partagées sont correctement sérialisés
- les appels d’espace de noms s’exécutent via les outils du catalogue et renvoient des détails compatibles avec JSON
- les échecs peuvent être interceptés par le code invité
- les appels d’espace de noms suspendus reprennent via `wait`
- la restauration du plugin efface les enregistrements d’espace de noms dont il est propriétaire

Les espaces de noms complètent le catalogue générique `tools.search`/`tools.call` : utilisez le
catalogue pour les outils OpenClaw, de plugin et de client activés arbitrairement ; utilisez `MCP`
pour les outils MCP ; utilisez d’autres espaces de noms pour les API de domaine documentées appartenant aux plugins,
lorsqu’un code concis est plus fiable que des recherches répétées de schémas.

## API de sortie

- `text(value)` ajoute une sortie lisible par l’humain au tableau `output`.
- `json(value)` ajoute un élément de sortie structuré après une sérialisation
  compatible avec JSON.
- La valeur finale renvoyée par le code invité devient `value` dans un résultat
  `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Règles : l’ordre de sortie correspond aux appels du code invité ; la sortie est limitée par
`maxOutputBytes` ; les valeurs non sérialisables sont converties en chaînes simples ou en
erreurs ; les valeurs binaires ne sont pas prises en charge. Les images et les fichiers transitent par
les outils OpenClaw ordinaires, et non par le pont du mode code.

## Catalogue d’outils

Le catalogue masqué inclut les outils après le filtrage effectif des politiques, dans cet
ordre : outils principaux d’OpenClaw, outils des plugins intégrés, outils des plugins externes, outils MCP,
puis outils fournis par le client pour l’exécution actuelle.

Les identifiants du catalogue sont stables au sein d’une exécution et déterministes entre des
ensembles d’outils équivalents lorsque cela est possible. Format réel :

```text
<source>:<owner>:<tool-name>
```

où `<source>` vaut `openclaw`, `mcp` ou `client` (les outils de plugin utilisent
`openclaw` avec l’identifiant du plugin comme `<owner>` ; les outils principaux utilisent `openclaw:core:*`).
Exemples :

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Le catalogue omet les outils de contrôle du mode code (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) et les outils à accès direct uniquement. Les contrôles
ne doivent pas effectuer d’appels récursifs via le catalogue ; les outils à accès direct uniquement restent visibles par le modèle,
car leurs résultats structurés ne peuvent pas traverser le pont QuickJS.

Les entrées MCP restent dans le catalogue limité à l’exécution afin que les politiques, les approbations, les hooks,
la télémétrie, la projection de la transcription et les identifiants d’outils exacts restent partagés avec
l’exécution normale des outils. Les vues destinées au code invité `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` et `tools.call(...)` omettent les entrées MCP. L’espace de noms
généré `MCP.<server>.<tool>({ ...input })` se résout vers l’identifiant exact du catalogue
et distribue l’appel via le même chemin d’exécution.

## Interaction avec Tool Search

Le mode code remplace la surface de modèle OpenClaw Tool Search pour les exécutions où il
est actif.

Lorsque `tools.codeMode.enabled` vaut true et que le mode code s’active :

- OpenClaw n’expose pas `tool_search_code`, `tool_search`, `tool_describe`
  ni `tool_call` comme outils visibles par le modèle.
- Le même principe de catalogage est déplacé dans l’environnement d’exécution invité.
- L’environnement d’exécution invité reçoit des métadonnées compactes `ALL_TOOLS` ainsi que des assistants de recherche, de description et
  d’appel pour les outils non-MCP.
- Les appels MCP utilisent l’espace de noms `MCP` généré et ses en-têtes `$api()` au lieu
  de `tools.call(...)`.
- Les appels imbriqués sont distribués via le même chemin d’exécution OpenClaw que celui utilisé par Tool
  Search.

Consultez [Tool Search](/fr/tools/tool-search) pour le pont de catalogue compact OpenClaw
que le mode code remplace pour les exécutions actives.

## Noms d’outils et collisions

L’outil `exec` visible par le modèle est l’outil du mode code. Si l’outil `exec` du shell OpenClaw
normal est activé, il est masqué au modèle et catalogué comme
n’importe quel autre outil.

À l’intérieur de l’environnement d’exécution invité :

- `tools.call("openclaw:core:exec", input)` peut appeler l’outil d’exécution shell si
  la politique l’autorise.
- `tools.exec(...)` n’est installé que si l’entrée du catalogue d’exécution shell possède un
  nom sûr non ambigu.
- l’outil `exec` du mode code n’est jamais disponible récursivement via `tools`.

Si deux outils se normalisent vers le même nom pratique sûr, OpenClaw omet la
fonction pratique et impose `tools.call(id, input)`.

## Exécution imbriquée d’outils

Chaque appel d’outil imbriqué traverse le pont de l’hôte et entre de nouveau dans OpenClaw,
en préservant : l’identifiant de l’agent actif, l’identifiant et la clé de session, le contexte de
l’expéditeur et du canal, la politique de bac à sable, la politique d’approbation, les hooks
`before_tool_call` des plugins, le signal d’abandon, les mises à jour en continu lorsqu’elles
sont disponibles, ainsi que les événements de trajectoire et d’audit.

Les appels imbriqués sont projetés dans la transcription comme de véritables appels d’outils afin que les
paquets d’assistance montrent ce qui s’est passé, la projection identifiant l’appel d’outil
parent du mode code et l’identifiant de l’outil imbriqué.

Les appels imbriqués parallèles sont autorisés jusqu’à `maxPendingToolCalls`.

## Cycle de vie des exécutions et des instantanés

Chaque exécution en mode code est suivie dans une map en mémoire du processus indexée par `runId` (non
persistée sur disque ni dans une base de données). `exec`/`wait` renvoient l’un des trois
états de résultat suivants : `completed`, `waiting` ou `failed`.

- Un résultat `waiting` stocke l’instantané QuickJS, les requêtes de pont en attente et
  les métadonnées de portée (identifiant d’exécution de l’agent, identifiant/clé de session) jusqu’à ce que `wait` le reprenne ou
  qu’il expire.
- Les valeurs `runId` expirées, associées à une mauvaise session ou à une mauvaise exécution, inconnues ou déjà en cours de reprise
  ne produisent pas d’état terminal distinct ; elles apparaissent sous forme de
  résultat `failed` (`code: "invalid_input"`) avec un message tel que `code mode
run is unavailable or expired.` ou `code mode run belongs to a different
session.`.
- L’instantané d’une exécution est supprimé de la map dès que celle-ci se termine avec
  `completed` ou `failed`, ou est abandonné à l’arrêt du Gateway (rien
  ne survit à un redémarrage : il s’agit d’un état d’exécution transitoire).
- Pour les opérations en lecture seule, `exec` peut définir `restartSafe: true`. OpenClaw rejette alors
  avant l’exécution les appels du catalogue ayant des effets de bord et les espaces de noms des plugins, et
  marque les résultats suspendus comme pouvant être rejoués en toute sécurité. Si un redémarrage interrompt `wait`,
  la [récupération après redémarrage](/gateway/restart-recovery) reconstruit le tour à partir de la
  transcription au lieu de restaurer l’instantané local au processus. Le tour de récupération
  reste lui-même limité aux outils principaux audités en lecture seule et aux outils de plugins
  explicitement rejouables en toute sécurité.
- OpenClaw limite le nombre d’exécutions suspendues simultanément par processus (64) et
  rejette toute nouvelle suspension au-delà de cette limite avec `too many suspended code mode
runs.`.

Le stockage des instantanés est limité par `maxSnapshotBytes` pour chaque exécution, par la limite
d’exécutions suspendues par processus indiquée ci-dessus et par `snapshotTtlSeconds`.

## Environnement d’exécution QuickJS-WASI

OpenClaw charge `quickjs-wasi` comme dépendance directe dans le paquet propriétaire ; il
ne s’appuie pas sur une copie transitive installée pour une dépendance sans rapport.

Responsabilités de l’environnement d’exécution : compiler/charger le module WebAssembly QuickJS-WASI ;
créer une VM isolée pour chaque exécution ou reprise en mode code ; enregistrer les rappels de l’hôte
sous des noms stables ; définir les limites de mémoire et d’interruption ; évaluer le JavaScript ; vider
les tâches en attente ; créer un instantané de l’état suspendu de la VM ; restaurer les instantanés pour `wait` ;
libérer les handles de VM et les instantanés après les états terminaux.

L’environnement d’exécution s’exécute dans un thread worker Node.js, en dehors de la boucle
d’événements principale d’OpenClaw. Une boucle infinie dans l’invité ne doit pas bloquer indéfiniment
le processus Gateway ; le gestionnaire d’interruption du worker applique le délai maximal en temps réel,
indépendamment de la coopération du code invité.

## TypeScript

La prise en charge de TypeScript consiste uniquement en une transformation du code source : l’entrée acceptée est une
chaîne de code TypeScript ; la sortie est une chaîne JavaScript évaluée par
QuickJS-WASI. Il n’y a ni vérification des types, ni résolution des modules, ni
`import`/`require`. Les diagnostics sont renvoyés sous forme de résultats `failed`.

Le compilateur TypeScript n’est chargé à la demande que pour les cellules TypeScript ; les cellules
JavaScript simples et le mode code désactivé ne le chargent jamais.

## Périmètre de sécurité

Le code du modèle est hostile. L’environnement d’exécution applique une défense en profondeur :

- exécute QuickJS-WASI en dehors de la boucle d’événements principale, dans un thread worker
- charge `quickjs-wasi` comme dépendance directe, et non via Codex ou un
  paquet transitif
- aucun système de fichiers, réseau, sous-processus, importation de module, variable d’environnement
  ni objet global de l’hôte dans l’invité
- utilise les limites de mémoire et d’interruption de QuickJS, ainsi qu’un délai maximal en temps réel
  appliqué par le processus parent
- applique des limites aux sorties, instantanés, journaux et appels en attente
- sérialise les valeurs du pont de l’hôte via un adaptateur JSON restreint
- convertit les erreurs de l’hôte en erreurs simples de l’invité, jamais en objets du domaine de l’hôte
- abandonne les instantanés en cas de dépassement de délai, d’abandon, de fin de session ou d’expiration
- rejette l’accès récursif à `exec`, `wait` et aux outils de contrôle Tool Search
- empêche les collisions de noms pratiques de masquer les assistants du catalogue

Le bac à sable constitue une couche de sécurité ; les opérateurs peuvent néanmoins avoir besoin d’un
durcissement au niveau du système d’exploitation pour les déploiements à haut risque.

## Codes d’erreur

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` couvre les arguments `exec`/`wait` incorrects, les langages désactivés,
les accès aux modules rejetés, les échecs de transformation TypeScript, les valeurs `runId` inconnues, expirées
ou de portée incorrecte, ainsi qu’un trop grand nombre d’exécutions suspendues. `runtime_unavailable`
couvre un worker QuickJS qui ne parvient pas à démarrer ou se termine avec un code différent de zéro.

Les erreurs renvoyées à l’invité sont de simples données ; les instances `Error` de l’hôte, les objets de
pile, les prototypes et les fonctions de l’hôte ne passent pas dans QuickJS.

## Télémétrie

Le champ `telemetry` de chaque résultat indique : la taille du catalogue masqué et une ventilation
par source (nombre d’éléments `openclaw`/`mcp`/`client`), le nombre cumulé de recherches/descriptions/appels
pour le catalogue de l’exécution, ainsi que les noms d’outils visibles par le modèle (`exec`,
`wait` et les outils conservés uniquement en accès direct).

La télémétrie ne doit pas inclure de secrets, de valeurs brutes de l’environnement ni d’entrées
d’outils non expurgées au-delà de la politique de trajectoire existante d’OpenClaw.

## Débogage

Utilisez une journalisation ciblée du transport du modèle lorsque le mode code se comporte différemment d’une
exécution normale d’outil :

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Pour déboguer la structure de la charge utile, utilisez `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Cela journalise un instantané JSON limité et expurgé de la requête du modèle ; utilisez-le uniquement
pendant le débogage, car les invites et le texte des messages peuvent tout de même apparaître.

Pour déboguer les flux, utilisez `OPENCLAW_DEBUG_SSE=peek` afin de journaliser les cinq premiers
événements SSE expurgés. Le mode code échoue également de manière sécurisée si la charge utile
finale du fournisseur ne contient pas exactement un `exec`, un `wait` et uniquement les outils
directs approuvés une fois que la surface du mode code a été activée.

## Organisation de l’implémentation

- contrat de configuration : `tools.codeMode`
- générateur de catalogue : des outils effectifs vers les entrées compactes et la table des identifiants
- adaptateur de surface du modèle : remplace les outils visibles par les outils de contrôle/directs
- adaptateur d’exécution QuickJS-WASI : chargement, évaluation, instantané, restauration, libération
- superviseur de worker : délai d’expiration, abandon, isolation des plantages
- adaptateur de pont : rappels de l’hôte compatibles JSON et transmission des résultats
- adaptateur de transformation TypeScript
- stockage des instantanés : TTL, limites de taille, portée par exécution/session
- projection de trajectoire pour les appels d’outils imbriqués
- compteurs de télémétrie et diagnostics

L’implémentation réutilise les concepts de catalogue et d’exécuteur de la recherche d’outils, mais
n’utilise pas d’enfant `node:vm` comme bac à sable.

## Liste de contrôle de validation

La couverture du mode code doit prouver que :

- la configuration désactivée laisse inchangée l’exposition existante des outils
- une configuration sous forme d’objet sans `enabled: true` laisse le mode code désactivé
- la configuration activée expose `exec`, `wait` et uniquement les outils directs requis au
  modèle lorsque les outils sont actifs pour l’exécution
- les exécutions brutes sans outil, `disableTools` et les listes d’autorisation vides ne déclenchent
  pas l’application des contraintes de charge utile du mode code
- tous les outils effectifs non-MCP admissibles au catalogue apparaissent dans `ALL_TOOLS`
- les outils directs restent visibles par le modèle et n’apparaissent pas dans `ALL_TOOLS`
- les outils refusés n’apparaissent pas dans `ALL_TOOLS`
- `tools.search`, `tools.describe` et `tools.call` fonctionnent pour les outils OpenClaw
- `API.list("mcp")` et `API.read("mcp/<server>.d.ts")` exposent des déclarations MCP de style
  TypeScript sans appel de pont/d’outil
- `$api()` de l’espace de noms MCP reste disponible comme solution de repli en ligne pour les schémas
- les appels de l’espace de noms MCP fonctionnent pour les outils MCP visibles avec une seule entrée objet, tandis que
  les entrées directes du catalogue MCP sont absentes de `tools.*`
- les outils de contrôle de la recherche d’outils sont masqués à la fois de la surface du modèle et du
  catalogue masqué
- les appels imbriqués préservent le comportement d’approbation et des hooks
- la commande shell `exec` est masquée au modèle, mais peut être appelée par son identifiant de catalogue lorsqu’elle est
  autorisée
- les `exec` et `wait` récursifs du mode code ne peuvent pas être appelés depuis le code invité
- l’entrée TypeScript est transformée et évaluée sans charger TypeScript sur
  les chemins désactivés ou exclusivement JavaScript
- les accès à `import`, `require`, au système de fichiers, au réseau et à l’environnement échouent
- les boucles infinies expirent et ne peuvent pas bloquer le Gateway
- les échecs liés à la limite de mémoire mettent fin à la VM invitée
- les limites de sortie et d’instantané sont appliquées aux appels terminés et suspendus
- `wait` reprend un instantané suspendu et renvoie la valeur finale
- les valeurs `runId` expirées, abandonnées, associées à une autre session ou inconnues échouent
- la relecture et la persistance de la transcription préservent les appels de contrôle du mode code
- la transcription et la télémétrie affichent clairement les appels d’outils imbriqués

## Plan de test E2E

Exécutez ces tests comme tests d’intégration ou de bout en bout lors de la modification de l’environnement d’exécution :

1. Démarrez un Gateway avec `tools.codeMode.enabled: false`.
2. Envoyez un tour d’agent avec un petit ensemble d’outils directs.
3. Vérifiez que les outils visibles par le modèle sont inchangés.
4. Redémarrez avec `tools.codeMode.enabled: true`.
5. Envoyez un tour d’agent avec des outils de test OpenClaw, de Plugin, MCP et client.
6. Vérifiez que la liste des outils visibles par le modèle contient `exec`, `wait`, ainsi que seulement les outils
   directs configurés.
7. Dans `exec`, lisez `ALL_TOOLS` et vérifiez que les outils de test effectifs admissibles au
   catalogue sont présents, tandis que les outils directs sont absents.
8. Dans `exec`, appelez les outils OpenClaw/Plugin/client via `tools.search`,
   `tools.describe` et `tools.call`.
9. Dans `exec`, appelez `API.list("mcp")` et `API.read("mcp/<server>.d.ts")`, puis
   vérifiez que les fichiers de déclaration décrivent les outils MCP visibles.
10. Dans `exec`, appelez les outils MCP via `MCP.<server>.<tool>({ ...input })` et
    vérifiez que les entrées directes du catalogue MCP sont absentes de `ALL_TOOLS` et de
    `tools.*`.
11. Vérifiez que les outils refusés sont absents et ne peuvent pas être appelés au moyen d’un identifiant deviné.
12. Démarrez un appel d’outil imbriqué qui se résout après que `exec` a renvoyé `waiting`.
13. Appelez `wait` et vérifiez que la VM restaurée reçoit le résultat de l’outil.
14. Vérifiez que la réponse finale contient la sortie produite après la restauration.
15. Vérifiez que l’expiration du délai, l’abandon et l’expiration de l’instantané nettoient l’état de l’environnement d’exécution.
16. Exportez la trajectoire et vérifiez que les appels imbriqués sont visibles sous l’appel
    parent du mode code.

Les modifications limitées à la documentation de cette page doivent tout de même exécuter `pnpm check:docs`.

## Pages connexes

- [Recherche d’outils](/fr/tools/tool-search)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Outil Exec](/fr/tools/exec)
- [Exécution de code](/fr/tools/code-execution)
