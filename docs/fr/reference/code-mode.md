---
read_when:
    - Vous voulez activer le mode code d’OpenClaw pour une exécution d’agent
    - Vous devez expliquer en quoi le mode code est différent du mode Code de Codex
    - Vous examinez le contrat exec/wait, le bac à sable QuickJS-WASI, la transformation TypeScript ou le pont masqué vers le catalogue d’outils
    - Vous ajoutez ou révisez une intégration interne de registre d’espaces de noms en mode code
sidebarTitle: Code mode
summary: 'Mode code OpenClaw : une surface d’outils exec/wait optionnelle, basée sur QuickJS-WASI et un catalogue d’outils caché limité à l’exécution'
title: Mode code
x-i18n:
    generated_at: "2026-06-27T18:09:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Le mode code est une fonctionnalité expérimentale du runtime d’agent OpenClaw. Il est désactivé par
défaut. Lorsque vous l’activez, OpenClaw modifie ce que le modèle voit pour une exécution :
au lieu d’exposer directement chaque schéma d’outil activé, le modèle voit seulement
`exec` et `wait`.

Cette page documente le mode code d’OpenClaw. Ce n’est pas le mode Code de Codex. Les deux
fonctionnalités partagent un nom, mais elles sont implémentées par des runtimes différents et exposent
des contrats `exec` différents :

- Codex Code Mode est activé pour les fils app-server de Codex, sauf si une
  politique d’outils restrictive désactive le mode code natif. Il s’exécute dans le harnais de codage Codex,
  où le modèle écrit des commandes shell via un contrat `exec.command`.
- Le mode code OpenClaw est désactivé sauf si `tools.codeMode.enabled: true` est
  configuré. Il s’exécute dans le runtime d’agent générique OpenClaw, où le modèle
  écrit des programmes JavaScript ou TypeScript via un contrat `exec.code`.

Codex Code Mode et la recherche dynamique d’outils native Codex sont des surfaces stables du harnais Codex.
Le mode code OpenClaw est un adaptateur expérimental de surface d’outils, détenu par OpenClaw,
pour les exécutions OpenClaw génériques. Il utilise `quickjs-wasi`, un catalogue d’outils OpenClaw
masqué et l’exécuteur d’outils OpenClaw normal.

## Qu’est-ce que c’est ?

Le mode code OpenClaw permet au modèle d’écrire un petit programme JavaScript ou TypeScript
au lieu de choisir directement dans une longue liste d’outils.

Lorsque le mode code est actif :

- La liste d’outils visible par le modèle est exactement `exec` et `wait`.
- `exec` évalue du JavaScript ou du TypeScript généré par le modèle dans un worker
  QuickJS-WASI contraint.
- Les outils OpenClaw normaux sont masqués dans le prompt du modèle et exposés à l’intérieur du
  programme invité via `ALL_TOOLS` et `tools`.
- Le code invité peut rechercher dans le catalogue masqué, décrire un outil et appeler un outil
  via le même chemin d’exécution OpenClaw que celui utilisé par les tours d’agent normaux.
- Les outils MCP sont regroupés sous l’espace de noms `MCP`. En mode code, cet espace de noms
  est la seule manière prise en charge d’appeler les outils MCP.
- `wait` reprend une exécution en mode code suspendue lorsque des appels d’outils imbriqués sont encore
  en attente.

La distinction importante : le mode code modifie la surface d’orchestration
visible par le modèle. Il ne remplace pas les outils OpenClaw, les outils Plugin, les outils MCP, l’authentification,
la politique d’approbation, le comportement des canaux ni la sélection du modèle.

## Pourquoi est-ce utile ?

Le mode code facilite l’utilisation de grands catalogues d’outils par les modèles.

- Surface de prompt plus petite : les fournisseurs reçoivent deux outils de contrôle au lieu de dizaines
  ou de centaines de schémas d’outils complets.
- Meilleure orchestration : le modèle peut utiliser des boucles, des jointures, de petites transformations,
  de la logique conditionnelle et des appels d’outils imbriqués parallèles dans une seule cellule de code.
- Neutre vis-à-vis des fournisseurs : il fonctionne pour les outils OpenClaw, Plugin, MCP et client sans
  dépendre de l’exécution de code native du fournisseur.
- La politique existante reste appliquée : les appels d’outils imbriqués passent toujours par la politique OpenClaw,
  les approbations, les hooks, le contexte de session et les chemins d’audit.
- Mode d’échec clair : lorsque le mode code est explicitement activé et que le runtime est
  indisponible, OpenClaw échoue de manière fermée au lieu de revenir à une large exposition directe des outils.

Le mode code est particulièrement utile pour les agents disposant d’un grand catalogue d’outils activés ou
pour les workflows où le modèle doit rechercher, combiner et appeler des
outils de manière répétée avant de produire une réponse.

## Comment l’activer

Ajoutez `tools.codeMode.enabled: true` à la configuration de l’agent ou du runtime :

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

La forme abrégée est également acceptée :

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Le mode code reste désactivé lorsque `tools.codeMode` est omis, vaut `false`, ou est un objet
sans `enabled: true`.

Lorsque vous utilisez des agents sandboxés avec des serveurs MCP configurés, assurez-vous aussi que la
politique d’outils du sandbox autorise le Plugin MCP groupé, par exemple avec
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Voir
[Configuration - outils et fournisseurs personnalisés](/fr/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Utilisez des limites explicites lorsque vous souhaitez des bornes plus strictes :

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

Pour confirmer la forme de la charge utile du modèle pendant le débogage, exécutez le Gateway avec
une journalisation ciblée :

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Lorsque le mode code est actif, les noms d’outils visibles par le modèle dans les journaux doivent être `exec` et
`wait`. Si vous avez besoin de la charge utile fournisseur expurgée, ajoutez
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` pour une courte session de débogage.

## Visite technique

Le reste de cette page décrit le contrat du runtime et les détails d’implémentation.
Elle s’adresse aux mainteneurs, aux auteurs de Plugin qui déboguent l’exposition des outils, et aux
opérateurs qui valident des déploiements à haut risque.

## État du runtime

- Runtime : [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- État par défaut : désactivé.
- Stabilité : surface expérimentale OpenClaw ; le mode Code de Codex est une surface stable distincte
  du harnais Codex.
- Surface cible : exécutions d’agent OpenClaw génériques.
- Posture de sécurité : le code du modèle est hostile.
- Promesse visible par l’utilisateur : l’activation du mode code ne revient jamais silencieusement à une large
  exposition directe des outils.

## Portée

Le mode code possède la forme d’orchestration visible par le modèle pour une exécution préparée. Il ne
possède pas la sélection du modèle, le comportement des canaux, l’authentification, la politique d’outils ni les
implémentations d’outils.

Dans la portée :

- définitions d’outils `exec` et `wait` visibles par le modèle
- construction du catalogue d’outils masqué
- exécution invitée JavaScript et TypeScript
- runtime worker QuickJS-WASI
- callbacks hôtes pour la recherche dans le catalogue, la description de schéma et l’appel d’outil
- état reprenable pour les programmes invités suspendus
- limites de sortie, de délai d’expiration, de mémoire, d’appels en attente et de snapshots
- télémétrie et projection de trajectoire pour les appels d’outils imbriqués

Hors portée :

- exécution de code distante native du fournisseur
- sémantique d’exécution shell
- modification de l’autorisation existante des outils
- scripts persistants écrits par l’utilisateur
- accès au gestionnaire de paquets, aux fichiers, au réseau ou aux modules dans le code invité
- réutilisation directe des internes du Codex Code mode

Les outils détenus par le fournisseur, comme les sandboxes Python distants, restent des outils séparés. Voir
[Exécution de code](/fr/tools/code-execution).

## Termes

**Mode code** est le mode de runtime OpenClaw qui masque les outils normaux du modèle et
expose seulement `exec` et `wait`.

**Runtime invité** est la VM JavaScript QuickJS-WASI qui évalue le code du modèle.

**Pont hôte** est la surface étroite de callbacks compatible JSON depuis le code invité
vers OpenClaw.

**Catalogue** est la liste, limitée à l’exécution, des outils effectifs après la politique normale des outils,
la résolution des Plugin, MCP et outils client.

**Appel d’outil imbriqué** est un appel d’outil effectué depuis le code invité via le pont hôte.

**Snapshot** est l’état sérialisé de la VM QuickJS-WASI enregistré afin que `wait` puisse continuer une
exécution en mode code suspendue.

## Configuration

`tools.codeMode.enabled` est la porte d’activation. Définir d’autres champs du mode code
n’active pas la fonctionnalité.

Champs pris en charge :

- `enabled` : booléen. Par défaut `false`. Active le mode code uniquement lorsque `true`.
- `runtime` : `"quickjs-wasi"`. Seul runtime pris en charge.
- `mode` : `"only"`. Expose `exec` et `wait`, masque les outils normaux du modèle.
- `languages` : tableau de `"javascript"` et `"typescript"`. Inclut les deux par défaut.
- `timeoutMs` : limite en temps réel pour un `exec` ou `wait`. Par défaut `10000`.
  Limite runtime : `100` à `60000`.
- `memoryLimitBytes` : limite du tas QuickJS. Par défaut `67108864`. Limite runtime :
  `1048576` à `1073741824`.
- `maxOutputBytes` : limite pour le texte, le JSON et les journaux renvoyés. Par défaut `65536`.
  Limite runtime : `1024` à `10485760`.
- `maxSnapshotBytes` : limite pour les snapshots de VM sérialisés. Par défaut `10485760`.
  Limite runtime : `1024` à `268435456`.
- `maxPendingToolCalls` : limite des appels d’outils imbriqués concurrents. Par défaut `16`.
  Limite runtime : `1` à `128`.
- `snapshotTtlSeconds` : durée pendant laquelle une VM suspendue peut être reprise. Par défaut `900`.
  Limite runtime : `1` à `86400`.
- `searchDefaultLimit` : nombre par défaut de résultats de recherche dans le catalogue masqué. Par défaut `8`.
  Le runtime le borne à `maxSearchLimit`.
- `maxSearchLimit` : nombre maximal de résultats de recherche dans le catalogue masqué. Par défaut `50`.
  Limite runtime : `1` à `50`.

Si le mode code est activé mais que QuickJS-WASI ne peut pas se charger, OpenClaw échoue de manière fermée pour
cette exécution. Il n’expose pas silencieusement les outils normaux comme solution de repli.

## Activation

Le mode code est évalué une fois la politique d’outils effective connue et avant que la
requête finale au modèle soit assemblée.

Ordre d’activation :

1. Résoudre l’agent, le modèle, le fournisseur, le sandbox, le canal, l’expéditeur et la politique d’exécution.
2. Construire la liste effective des outils OpenClaw.
3. Ajouter les outils Plugin, MCP et client éligibles.
4. Appliquer la politique d’autorisation et de refus.
5. Si `tools.codeMode.enabled` vaut false, continuer avec l’exposition normale des outils.
6. Si activé et que des outils sont actifs pour l’exécution, enregistrer les outils effectifs dans
   le catalogue du mode code.
7. Retirer tous les outils normaux de la liste d’outils visible par le modèle.
8. Ajouter `exec` et `wait` du mode code.

Les exécutions qui n’ont volontairement aucun outil, comme les appels de modèle bruts, `disableTools`,
ou une liste d’autorisation vide, n’activent pas la surface du mode code même si la configuration
contient `tools.codeMode.enabled: true`.

Le catalogue du mode code est limité à l’exécution. Il ne doit pas divulguer d’outils provenant d’un autre agent,
d’une autre session, d’un autre expéditeur ou d’une autre exécution.

## Outils visibles par le modèle

Lorsque le mode code est actif, le modèle voit exactement ces outils de premier niveau :

- `exec`
- `wait`

Tous les autres outils activés sont masqués de la liste d’outils visible par le modèle et enregistrés
dans le catalogue du mode code.

Le modèle doit utiliser `exec` pour l’orchestration d’outils, la jointure de données, les boucles,
les appels imbriqués parallèles et les transformations structurées. Le modèle doit utiliser
`wait` uniquement lorsque `exec` renvoie un résultat reprenable `waiting`.

## `exec`

`exec` démarre une cellule en mode code et renvoie un résultat. Le code d’entrée est généré par le modèle
et doit être traité comme hostile.

Entrée :

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Règles d’entrée :

- L’un de `code` ou `command` doit être non vide.
- `code` est le champ documenté visible par le modèle.
- `command` est accepté comme alias compatible exec pour les politiques de hooks et
  les réécritures fiables ; lorsque les deux sont présents, les valeurs doivent correspondre.
- Les événements de hook `exec` externes du mode code incluent `toolKind: "code_mode_exec"` et
  incluent `toolInputKind: "javascript" | "typescript"` lorsque le langage d’entrée
  est connu, afin que les politiques puissent distinguer les cellules en mode code des appels `exec`
  de style shell qui partagent le même nom d’outil.
- `language` vaut `"javascript"` par défaut.
- Si `language` vaut `"typescript"`, OpenClaw transpile avant l’évaluation.
- `exec` rejette `import`, `require`, l’import dynamique et les motifs de chargeur de modules
  dans la v1.
- `exec` n’expose pas récursivement l’implémentation `exec` shell normale.

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

`exec` renvoie `waiting` lorsque la VM QuickJS se suspend avec un état reprenable qui
nécessite encore une continuation visible par le modèle. Le résultat inclut un `runId` pour
`wait`. Les appels de pont d’espace de noms, y compris les appels d’espace de noms MCP, sont purgés automatiquement
dans le même appel `exec`/`wait` lorsqu’ils sont prêts, afin qu’un bloc de code compact
puisse inspecter `$api()` et appeler un outil MCP sans forcer un appel d’outil de modèle par
attente d’espace de noms.

`exec` renvoie `completed` uniquement lorsque la VM invitée n’a aucun travail en attente et que la
valeur finale est compatible JSON après l’exécution de l’adaptateur de sortie d’OpenClaw.

## `wait`

`wait` reprend une VM en mode code suspendue.  

Entrée :

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

La sortie est la même union `CodeModeResult` que celle renvoyée par `exec`.

`wait` existe parce que les outils OpenClaw imbriqués peuvent être lents, interactifs, soumis à approbation
ou diffuser des mises à jour partielles. Le modèle ne devrait pas avoir à garder un long appel
`exec` ouvert pendant que l’hôte attend un travail externe.

L’instantané et la restauration QuickJS-WASI constituent le mécanisme de reprise v1 :

1. `exec` évalue le code jusqu’à l’achèvement, l’échec ou la suspension.
2. En cas de suspension, OpenClaw crée un instantané de la VM QuickJS et enregistre le travail hôte
   en attente.
3. Lorsque le travail en attente se termine, `wait` restaure l’instantané de la VM.
4. OpenClaw réenregistre les rappels hôtes par noms stables.
5. OpenClaw transmet les résultats des outils imbriqués à la VM restaurée.
6. OpenClaw vide les tâches QuickJS en attente.
7. `wait` renvoie `completed`, `failed` ou un autre résultat `waiting`.

Les instantanés sont un état d’exécution, pas des artefacts utilisateur. Leur taille est limitée, ils expirent
et ils sont limités à l’exécution et à la session qui les ont créés.

`wait` échoue lorsque :

- `runId` est inconnu.
- l’instantané a expiré.
- l’exécution ou la session parente a été abandonnée.
- l’appelant n’est pas dans la même portée d’exécution/session.
- la restauration QuickJS-WASI échoue.
- la restauration dépasserait les limites configurées.

## API d’exécution invitée

L’exécution invitée expose une petite API globale :

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` est une métadonnée compacte pour le catalogue limité à l’exécution. Il ne contient pas
les schémas complets par défaut.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

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

Les fonctions d’outils pratiques ne sont installées que pour les noms sûrs non ambigus :

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Les entrées du catalogue MCP ne peuvent pas être appelées via `tools.call(...)` ni via les fonctions
pratiques en mode code. Elles ne sont exposées que via l’espace de noms `MCP`
généré. Des fichiers de déclaration de style TypeScript sont disponibles via la surface de fichier virtuelle
`API` en lecture seule, afin que les agents puissent inspecter les signatures MCP
sans ajouter les schémas MCP à l’invite :

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

`API.read("mcp/<server>.d.ts")` renvoie des déclarations compactes déduites des métadonnées
d’outil MCP :

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

Les fichiers de déclaration sont virtuels, et non des fichiers écrits dans l’espace de travail ou dans le
répertoire d’état. Pour chaque appel `exec` en mode code, OpenClaw construit le catalogue
d’outils limité à l’exécution, conserve les entrées MCP visibles, génère `mcp/index.d.ts` plus une
déclaration `mcp/<server>.d.ts` par serveur visible, et injecte cette petite
table en lecture seule dans le worker QuickJS. Le code invité ne voit que l’objet `API` :
`API.list(prefix?)` renvoie les métadonnées de fichier et `API.read(path)` renvoie le
contenu de déclaration sélectionné. Les chemins inconnus et les segments `.` / `..` sont rejetés.

Cela garde les grands schémas MCP hors de l’invite du modèle. L’agent apprend que l’API
virtuelle existe depuis la description de l’outil `exec`, lit uniquement le fichier de déclaration
nécessaire, puis appelle `MCP.<server>.<tool>()` avec un seul argument objet.
`MCP.<server>.$api()` reste disponible comme solution de repli en ligne lorsque l’agent
a besoin d’une réponse de schéma pour un seul outil dans le programme.

L’exécution invitée ne doit pas exposer directement les objets hôtes. Les entrées et sorties traversent
le pont sous forme de valeurs compatibles JSON avec des limites de taille explicites.

## Espaces de noms internes

Les espaces de noms internes donnent au mode code une API de domaine concise sans ajouter davantage
d’outils visibles par le modèle. Une intégration détenue par le chargeur peut enregistrer un espace de noms
comme `Issues`, `Fictions` ou `Calendar`; le code invité appelle ensuite cet espace de noms
dans le programme QuickJS pendant qu’OpenClaw ne montre toujours que `exec` et `wait` au
modèle.

Les espaces de noms sont internes pour l’instant. Il n’existe pas d’API publique d’espace de noms pour le SDK Plugin :
les espaces de noms de Plugin externe nécessitent un contrat détenu par le chargeur afin que l’identité du Plugin,
les manifestes installés, l’état d’authentification et les descripteurs de catalogue mis en cache ne puissent pas diverger
des outils de Plugin qui sous-tendent l’espace de noms. Le mode code du noyau ne possède que le
bac à sable, la sérialisation, le filtrage du catalogue et la répartition du pont.

Le code invité peut ensuite utiliser soit le global direct, soit la carte `namespaces` :

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Cycle de vie du registre

Le registre des espaces de noms est local au processus et indexé par identifiant d’espace de noms. Une
exécution typique suit ce parcours :

1. Un chargeur de confiance appelle `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Le mode code crée le `ToolSearchRuntime` masqué pour l’exécution et lit son
   catalogue limité à l’exécution.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` conserve uniquement les enregistrements
   dont les `requiredToolNames` sont tous visibles et détenus par le même `pluginId`.
4. Chaque espace de noms visible appelle `createScope(ctx)` pour l’exécution courante. La
   portée reçoit le contexte d’exécution tel que `agentId`, `sessionKey`, `sessionId`,
   `runId`, la configuration et l’état d’abandon.
5. Les données de portée sont sérialisées dans un descripteur simple et injectées dans QuickJS comme
   globaux directs et `namespaces.<globalName>`.
6. Les appels invités se suspendent via le pont du worker, résolvent le chemin de l’espace de noms sur
   l’hôte, associent l’appel à un outil de catalogue déclaré et détenu par le Plugin, puis exécutent
   cet outil via `ToolSearchRuntime.call`.
7. OpenClaw vide automatiquement les appels de pont d’espace de noms prêts dans l’appel d’outil
   `exec`/`wait` actif. Si le travail d’espace de noms est encore en attente à l’expiration du délai ou
   si l’invité rend explicitement la main, `wait` reprend plus tard la même exécution d’espace de noms.
8. L’annulation ou la désinstallation d’un Plugin appelle `clearCodeModeNamespacesForPlugin(pluginId)`
   afin que les globaux obsolètes ne survivent pas à un échec de chargement du Plugin.

L’invariant important : les appels d’espace de noms sont des appels d’outils de catalogue. Ils utilisent les
mêmes hooks de politique, approbations, gestion d’abandon, télémétrie, projection de transcript
et comportement de suspension/reprise que `tools.call(...)`.

### Forme de l’enregistrement

Enregistrez les espaces de noms depuis l’intégration qui possède les outils sous-jacents. Gardez la
portée petite et exposez uniquement des verbes de domaine qui correspondent à des outils de catalogue déclarés.

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
fonction d’espace de noms appelable. L’`inputMapper` facultatif reçoit les arguments invités
et renvoie l’objet d’entrée pour l’outil de catalogue sous-jacent. Sans
mappeur d’entrée, le premier argument invité est utilisé, ou `{}` s’il est omis.

Les fonctions hôtes brutes sont rejetées avant l’exécution du code invité :

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Propriété et visibilité

La propriété de l’espace de noms est liée au `pluginId` de l’appelant de l’enregistrement.
`requiredToolNames` est à la fois une barrière de visibilité et un contrôle de propriété :

- chaque outil requis doit exister dans le catalogue d’exécution
- chaque outil requis doit avoir `sourceName === pluginId`
- l’espace de noms est masqué lorsqu’un outil requis est absent ou détenu par un autre
  Plugin
- chaque chemin appelable ne peut cibler qu’un outil nommé dans `requiredToolNames`

Cela empêche un autre Plugin d’exposer un espace de noms en enregistrant un
outil portant le même nom. Cela garde aussi les espaces de noms alignés sur la politique ordinaire des agents :
si l’exécution ne peut pas voir les outils sous-jacents, elle ne peut pas voir l’espace de noms.

Par exemple, un espace de noms GitHub devrait vivre derrière une extension détenue par GitHub qui
possède l’authentification GitHub, les clients REST ou GraphQL, les limites de débit, les approbations d’écriture et
les tests. Le mode code du noyau ne devrait pas intégrer d’API propres à GitHub, de gestion de jetons ni de
politique de fournisseur.

### Règles de sérialisation de portée

`createScope(ctx)` peut renvoyer un objet simple contenant des valeurs compatibles JSON,
des tableaux, des objets imbriqués et des marqueurs d’appel `createCodeModeNamespaceTool(...)`.
Les objets hôtes n’entrent jamais directement dans QuickJS.

Le sérialiseur rejette :

- les fonctions brutes
- les graphes d’objets circulaires
- les segments de chemin non sûrs : `__proto__`, `constructor`, `prototype`, clés vides ou
  clés contenant le séparateur de chemin interne
- les valeurs `globalName` qui ne sont pas des identifiants JavaScript
- les collisions de `globalName` avec les globaux intégrés du mode code comme `tools`,
  `namespaces`, `text`, `json`, `yield_control` ou `__openclaw*`

Les valeurs qui ne peuvent pas être sérialisées en JSON sont converties en valeurs de repli
compatibles JSON avant de traverser le pont. Les données binaires, handles, sockets, clients et
instances de classes devraient rester derrière les outils de catalogue ordinaires.

### Invites

La `description` de l’espace de noms et le `prompt` facultatif sont ajoutés au schéma `exec`
visible par le modèle uniquement lorsque l’espace de noms est visible pour cette exécution. Utilisez-les
pour enseigner la plus petite surface utile :

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Gardez les invites centrées sur le contrat de l’espace de noms, pas sur la configuration d’authentification, l’historique
d’implémentation ni le comportement sans rapport du Plugin.

### Nettoyage

Les espaces de noms sont des enregistrements locaux au processus. Supprimez-les quand le Plugin propriétaire
est désactivé, désinstallé ou restauré à une version précédente :

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Le nettoyage du mode code appartient au Plugin ; effacez les enregistrements d’espaces de noms du plugin
quand son cycle de vie se termine, au lieu de conserver des handles de démontage par espace de noms. Les tests
peuvent appeler `clearCodeModeNamespacesForTest()` pour éviter les fuites d’enregistrements
entre les cas.

### Liste de contrôle de test

Les changements d’espace de noms doivent couvrir la frontière de sécurité et le comportement invité :

- le texte de prompt de l’espace de noms n’apparaît que lorsque les outils sous-jacents sont visibles
- les outils de même nom provenant d’un autre `sourceName` n’exposent pas l’espace de noms
- les fonctions de portée brutes sont rejetées
- les identifiants d’espace de noms forgés et les chemins forgés sont rejetés
- les chemins appelables ne peuvent pas cibler des outils non déclarés
- les objets imbriqués et les références partagées se sérialisent correctement
- les appels d’espace de noms s’exécutent via les outils du catalogue et renvoient des détails compatibles JSON
- les échecs peuvent être interceptés par le code invité
- les appels d’espace de noms suspendus reprennent via `wait`
- la restauration du plugin à une version précédente efface les enregistrements d’espaces de noms propriétaires

Les espaces de noms complètent le catalogue générique `tools.search` / `tools.call`. Utilisez le
catalogue pour les outils OpenClaw, plugin et client activés arbitraires ; utilisez `MCP` pour
les outils MCP ; utilisez d’autres espaces de noms pour les API de domaine documentées, détenues par un plugin, pour lesquelles
du code concis est plus fiable que des recherches répétées de schéma.

## API de sortie

`text(value)` ajoute une sortie lisible par l’humain au tableau `output`.

`json(value)` ajoute un élément de sortie structuré après une sérialisation
compatible JSON.

La valeur finale renvoyée par le code invité devient `value` dans un résultat `completed`.

Élément de sortie :

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Règles de sortie :

- l’ordre des sorties correspond aux appels invités
- la sortie est plafonnée par `maxOutputBytes`
- les valeurs non sérialisables sont converties en chaînes simples ou en erreurs
- les valeurs binaires ne sont pas prises en charge en v1
- les images et fichiers transitent par les outils OpenClaw ordinaires, et non par le
  pont du mode code

## Catalogue d’outils

Le catalogue masqué inclut les outils après le filtrage effectif par politique :

1. Outils principaux d’OpenClaw.
2. Outils de plugins intégrés.
3. Outils de plugins externes.
4. Outils MCP.
5. Outils fournis par le client pour l’exécution courante.

Les identifiants de catalogue sont stables au sein d’une exécution et déterministes entre ensembles d’outils
équivalents lorsque c’est possible.

Forme d’identifiant recommandée :

```text
<source>:<owner>:<tool-name>
```

Exemples :

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Le catalogue omet les outils de contrôle du mode code :

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Cela empêche la récursion et garde le contrat exposé au modèle étroit.

Les entrées MCP restent dans le catalogue limité à l’exécution afin que la politique, les approbations, les hooks,
la télémétrie, la projection de transcript et les identifiants exacts d’outils restent partagés avec l’exécution normale
des outils. Les vues exposées à l’invité `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` et `tools.call(...)` omettent les entrées MCP. L’espace de noms
généré `MCP.<server>.<tool>({ ...input })` se résout vers l’identifiant exact du catalogue, puis se distribue via le
même chemin d’exécution.

## Interaction Tool Search

Le mode code remplace la surface de modèle OpenClaw Tool Search pour les exécutions où il est
actif.

Lorsque `tools.codeMode.enabled` vaut true et que le mode code s’active :

- OpenClaw n’expose pas `tool_search_code`, `tool_search`, `tool_describe`,
  ni `tool_call` comme outils visibles par le modèle.
- La même idée de catalogage se déplace dans le runtime invité.
- Le runtime invité reçoit des métadonnées compactes `ALL_TOOLS` ainsi que des assistants de recherche, de description
  et d’appel pour les outils non-MCP.
- Les appels MCP utilisent l’espace de noms généré `MCP` et ses en-têtes `$api()` au lieu
  de `tools.call(...)`.
- Les appels imbriqués sont distribués par le même chemin d’exécution OpenClaw que Tool Search
  utilise.

La page existante [Tool Search](/fr/tools/tool-search) décrit le pont de catalogue compact OpenClaw.
Le mode code est l’alternative OpenClaw générique pour les exécutions qui peuvent
utiliser `exec` et `wait`.

## Noms d’outils et collisions

L’outil `exec` visible par le modèle est l’outil du mode code. Si l’outil shell `exec` normal d’OpenClaw
est activé, il est masqué au modèle et catalogué comme n’importe quel
autre outil.

Dans le runtime invité :

- `tools.call("openclaw:core:exec", input)` peut appeler l’outil shell exec si
  la politique l’autorise.
- `tools.exec(...)` est installé seulement si l’entrée de catalogue shell exec a un
  nom sûr non ambigu.
- l’outil `exec` du mode code n’est jamais disponible récursivement via `tools`.

Si deux outils se normalisent vers le même nom pratique sûr, OpenClaw omet la
fonction pratique et exige `tools.call(id, input)`.

## Exécution d’outils imbriqués

Chaque appel d’outil imbriqué traverse le pont hôte et réentre dans OpenClaw.

L’exécution imbriquée préserve :

- l’identifiant de l’agent actif
- l’identifiant de session et la clé de session
- le contexte de l’expéditeur et du canal
- la politique de bac à sable
- la politique d’approbation
- les hooks `before_tool_call` du plugin
- le signal d’abandon
- les mises à jour en streaming lorsqu’elles sont disponibles
- les événements de trajectoire et d’audit

Les appels imbriqués sont projetés dans le transcript comme de vrais appels d’outils, afin que les lots de support
puissent montrer ce qui s’est passé. La projection identifie l’appel d’outil parent du mode code
et l’identifiant de l’outil imbriqué.

Les appels imbriqués parallèles sont autorisés jusqu’à `maxPendingToolCalls`.

## État du runtime

Chaque exécution en mode code possède une machine d’état :

- `running` : la VM s’exécute ou des appels imbriqués sont en cours.
- `waiting` : un instantané de VM existe et peut être repris avec `wait`.
- `completed` : valeur finale renvoyée ; instantané supprimé.
- `failed` : erreur renvoyée ; instantané supprimé.
- `expired` : l’instantané ou l’état en attente a dépassé la rétention ; reprise impossible.
- `aborted` : exécution/session parente annulée ; instantané supprimé.

L’état est limité par exécution d’agent, session et identifiant d’appel d’outil. Un appel `wait` depuis une
autre exécution ou session échoue.

Le stockage des instantanés est borné :

- octets d’instantané maximum par exécution
- nombre maximum d’instantanés vivants par processus
- TTL d’instantané
- nettoyage à la fin de l’exécution
- nettoyage à l’arrêt du Gateway lorsque la persistance n’est pas prise en charge

## Runtime QuickJS-WASI

OpenClaw charge `quickjs-wasi` comme dépendance directe dans le package propriétaire. Le
runtime ne dépend pas d’une copie transitive installée pour un proxy, PAC ou d’autres
dépendances sans rapport.

Responsabilités du runtime :

- compiler ou charger le module WebAssembly QuickJS-WASI
- créer une VM isolée par exécution ou reprise de mode code
- enregistrer les callbacks hôte par noms stables
- définir les limites de mémoire et d’interruption
- évaluer JavaScript
- drainer les jobs en attente
- prendre un instantané de l’état de VM suspendu
- restaurer les instantanés pour `wait`
- libérer les handles de VM et les instantanés après les états terminaux

Le runtime s’exécute hors de la boucle d’événements principale d’OpenClaw dans un worker. Une boucle infinie
invitée ne doit pas bloquer indéfiniment le processus Gateway.

## TypeScript

La prise en charge TypeScript est uniquement une transformation de source :

- entrée acceptée : une chaîne de code TypeScript
- sortie : chaîne JavaScript évaluée par QuickJS-WASI
- pas de vérification de types
- pas de résolution de modules
- pas de `import` ni de `require` en v1
- les diagnostics sont renvoyés comme résultats `failed`

Le compilateur TypeScript est chargé paresseusement uniquement pour les cellules TypeScript. Les cellules
JavaScript simples et le mode code désactivé ne chargent pas le compilateur.

La transformation doit préserver les numéros de ligne utiles lorsque c’est possible.

## Frontière de sécurité

Le code du modèle est hostile. Le runtime utilise une défense en profondeur :

- exécuter QuickJS-WASI hors de la boucle d’événements principale
- charger `quickjs-wasi` comme dépendance directe, et non via Codex ou un package
  transitif
- aucun système de fichiers, réseau, sous-processus, import de module, variable d’environnement ni
  objet global hôte dans l’invité
- utiliser les limites de mémoire et d’interruption de QuickJS
- appliquer un délai d’expiration mural du processus parent
- appliquer des plafonds de sortie, d’instantané, de journal et d’appels en attente
- sérialiser les valeurs du pont hôte via un adaptateur JSON étroit
- convertir les erreurs hôte en erreurs invitées simples, jamais en objets du domaine hôte
- abandonner les instantanés en cas de délai d’expiration, d’abandon, de fin de session ou d’expiration
- rejeter l’accès récursif à `exec`, `wait` et aux outils de contrôle Tool Search
- empêcher les collisions de noms pratiques de masquer les assistants du catalogue

Le bac à sable est une couche de sécurité. Les opérateurs peuvent tout de même avoir besoin d’un durcissement
au niveau du système d’exploitation pour les déploiements à haut risque.

## Codes d’erreur

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Les erreurs renvoyées à l’invité sont des données simples. Les instances `Error` de l’hôte, les objets de pile,
les prototypes et les fonctions hôte ne traversent pas vers QuickJS.

## Télémétrie

Le mode code rapporte :

- les noms d’outils visibles envoyés au modèle
- la taille du catalogue masqué et la répartition par source
- les décomptes `exec` et `wait`
- les décomptes de recherches, descriptions et appels imbriqués
- les identifiants des outils imbriqués appelés
- les échecs de plafonds de délai d’expiration, mémoire, instantané et sortie
- les événements du cycle de vie des instantanés

La télémétrie ne doit pas inclure de secrets, de valeurs d’environnement brutes ni d’entrées d’outils non caviardées
au-delà de la politique de trajectoire existante d’OpenClaw.

## Débogage

Utilisez la journalisation ciblée du transport modèle lorsque le mode code se comporte différemment d’une
exécution d’outil normale :

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Pour déboguer la forme des charges utiles, utilisez `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Cela journalise un instantané JSON plafonné et caviardé de la requête modèle ; il ne doit être
utilisé que pendant le débogage, car les prompts et le texte des messages peuvent encore apparaître.

Pour déboguer le flux, utilisez `OPENCLAW_DEBUG_SSE=peek` afin de journaliser les cinq premiers
événements SSE caviardés. Le mode code échoue aussi de manière fermée si la charge utile finale du fournisseur
ne contient pas exactement `exec` et `wait` après l’activation de la surface du mode code.

## Agencement de l’implémentation

Unités d’implémentation :

- contrat de configuration : `tools.codeMode`
- constructeur de catalogue : outils effectifs vers entrées compactes et table d’identifiants
- adaptateur de surface modèle : remplacer les outils visibles par `exec` et `wait`
- adaptateur de runtime QuickJS-WASI : chargement, évaluation, instantané, restauration, libération
- superviseur de worker : délai d’expiration, abandon, isolation des plantages
- adaptateur de pont : callbacks hôte compatibles JSON et livraison des résultats
- adaptateur de transformation TypeScript
- magasin d’instantanés : TTL, plafonds de taille, portée par exécution/session
- projection de trajectoire pour les appels d’outils imbriqués
- compteurs de télémétrie et diagnostics

L’implémentation réutilise les concepts de catalogue et d’exécuteur de Tool Search, mais
n’utilise pas l’enfant `node:vm` comme bac à sable.

## Liste de contrôle de validation

La couverture du mode code doit prouver :

- la configuration désactivée laisse l’exposition existante des outils inchangée
- la configuration objet sans `enabled: true` laisse le mode code désactivé
- la configuration activée n’expose que `exec` et `wait` au modèle lorsque les outils sont
  actifs pour l’exécution
- les exécutions brutes sans outil, `disableTools` et les listes d’autorisation vides ne déclenchent pas l’application
  de la charge utile du mode code
- tous les outils non-MCP effectifs apparaissent dans `ALL_TOOLS`
- les outils refusés n’apparaissent pas dans `ALL_TOOLS`
- `tools.search`, `tools.describe` et `tools.call` fonctionnent pour les outils OpenClaw
- `API.list("mcp")` et `API.read("mcp/<server>.d.ts")` exposent des déclarations MCP de style TypeScript
  sans appel de pont ni d’outil
- l’espace de noms MCP `$api()` reste disponible comme solution de repli en ligne pour les schémas
- les appels à l’espace de noms MCP fonctionnent pour les outils MCP visibles avec une entrée objet unique, tandis que
  les entrées directes du catalogue MCP sont absentes de `tools.*`
- les outils de contrôle Tool Search sont masqués à la fois de la surface du modèle et du catalogue
  masqué
- les appels imbriqués préservent le comportement d’approbation et des hooks
- le shell `exec` est masqué au modèle mais appelable par identifiant de catalogue lorsqu’il est autorisé
- les `exec` et `wait` récursifs du mode code ne sont pas appelables depuis le code invité
- l’entrée TypeScript est transformée et évaluée sans charger TypeScript sur
  les chemins désactivés ou JavaScript uniquement
- `import`, `require`, le système de fichiers, le réseau et l’accès à l’environnement échouent
- les boucles infinies expirent et ne peuvent pas bloquer le Gateway
- les échecs de limite mémoire terminent la VM invitée
- les limites de sortie et d’instantané sont appliquées aux appels terminés et suspendus
- `wait` reprend un instantané suspendu et renvoie la valeur finale
- les valeurs `runId` expirées, abandonnées, de mauvaise session et inconnues échouent
- la relecture et la persistance de la transcription préservent les appels de contrôle du mode code
- la transcription et la télémétrie affichent clairement les appels d’outils imbriqués

## Plan de test E2E

Exécutez-les comme tests d’intégration ou de bout en bout lors de la modification du runtime :

1. Démarrez un Gateway avec `tools.codeMode.enabled: false`.
2. Envoyez un tour d’agent avec un petit ensemble d’outils directs.
3. Vérifiez que les outils visibles par le modèle sont inchangés.
4. Redémarrez avec `tools.codeMode.enabled: true`.
5. Envoyez un tour d’agent avec des outils de test OpenClaw, de plugin, MCP et client.
6. Vérifiez que la liste d’outils visible par le modèle est exactement `exec`, `wait`.
7. Dans `exec`, lisez `ALL_TOOLS` et vérifiez que les outils de test effectifs sont présents.
8. Dans `exec`, appelez les outils OpenClaw/plugin/client via `tools.search`,
   `tools.describe` et `tools.call`.
9. Dans `exec`, appelez `API.list("mcp")` et `API.read("mcp/<server>.d.ts")` et
   vérifiez que les fichiers de déclaration décrivent les outils MCP visibles.
10. Dans `exec`, appelez les outils MCP via `MCP.<server>.<tool>({ ...input })` et
    vérifiez que les entrées directes du catalogue MCP sont absentes de `ALL_TOOLS` et de `tools.*`.
11. Vérifiez que les outils refusés sont absents et ne peuvent pas être appelés avec un identifiant deviné.
12. Démarrez un appel d’outil imbriqué qui se résout après que `exec` renvoie `waiting`.
13. Appelez `wait` et vérifiez que la VM restaurée reçoit le résultat de l’outil.
14. Vérifiez que la réponse finale contient la sortie produite après la restauration.
15. Vérifiez que l’expiration, l’abandon et l’expiration d’instantané nettoient l’état du runtime.
16. Exportez la trajectoire et vérifiez que les appels imbriqués sont visibles sous l’appel parent
    du mode code.

Les modifications de documentation uniquement apportées à cette page doivent tout de même exécuter `pnpm check:docs`.

## Liens associés

- [Tool Search](/fr/tools/tool-search)
- [Runtimes d’agent](/fr/concepts/agent-runtimes)
- [Outil exec](/fr/tools/exec)
- [Exécution de code](/fr/tools/code-execution)
