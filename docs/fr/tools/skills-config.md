---
read_when:
    - Configuration du chargement, de l’installation ou du contrôle d’accès des Skills
    - Définition de la visibilité des Skills par agent
    - Ajustement des limites de l’atelier de Skills ou de la politique d’approbation
sidebarTitle: Skills config
summary: Référence complète du schéma de configuration `skills.*`, des listes d’autorisation des agents, des paramètres de l’atelier et de la gestion des variables d’environnement du bac à sable.
title: Configuration des Skills
x-i18n:
    generated_at: "2026-07-16T13:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

La plupart des paramètres de configuration des Skills se trouvent sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité propre à chaque agent se trouve sous
`agents.defaults.skills` et `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Pour la génération d’images intégrée, utilisez `agents.defaults.imageGenerationModel`
  avec l’outil principal `image_generate` plutôt que `skills.entries`. Les entrées
  de Skills sont réservées aux workflows de Skills personnalisés ou tiers.
</Note>

## Chargement (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Répertoires de Skills supplémentaires à analyser, avec la priorité la plus faible (après
  les Skills intégrés et ceux des Plugins). Les chemins sont développés avec la prise en charge de `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Répertoires cibles réels et approuvés vers lesquels les dossiers de Skills liés symboliquement peuvent pointer,
  même lorsque le lien symbolique se trouve hors de la racine configurée. Utilisez ce paramètre pour
  les structures intentionnelles de dépôts frères telles que
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Limitez strictement cette liste
  — n’indiquez pas de racines étendues comme `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Surveille les dossiers de Skills et actualise l’instantané des Skills lorsque les fichiers `SKILL.md`
  changent. Inclut les fichiers imbriqués sous les racines de Skills regroupées.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Fenêtre d’anti-rebond des événements de surveillance des Skills, en millisecondes.
</ParamField>

## Installation (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Privilégie les programmes d’installation Homebrew lorsque `brew` est disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Préférence de gestionnaire de paquets Node pour l’installation des Skills. Cela concerne uniquement
  l’installation des Skills : la CLI OpenClaw et l’environnement d’exécution du Gateway nécessitent Node, car le
  magasin d’état canonique utilise `node:sqlite`. `openclaw setup --node-manager` et
  `openclaw onboard --node-manager` acceptent `npm`, `pnpm` ou `bun` ; définissez
  `"yarn"` directement dans la configuration pour les installations de Skills reposant sur Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Autorise les clients Gateway `operator.admin` approuvés à installer des archives zip
  privées préparées via `skills.upload.*`. Les installations ClawHub ordinaires ne nécessitent pas
  ce paramètre.
</ParamField>

## Politique d’installation de l’opérateur (`security.installPolicy`)

Utilisez `security.installPolicy` lorsque les opérateurs ont besoin d’une commande locale approuvée pour
autoriser ou bloquer l’installation de Skills et de Plugins selon une politique propre à l’hôte. La
politique s’exécute après qu’OpenClaw a préparé les fichiers sources et avant la poursuite
de l’installation ou de la mise à jour. Elle s’applique aux Skills ClawHub, aux Skills téléversés, aux
Skills Git/locaux, aux programmes d’installation des dépendances de Skills et aux sources d’installation ou de mise à jour
des Plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Active la politique d’installation gérée par l’opérateur. Lorsqu’elle est activée sans commande
  `exec` valide, les installations sont bloquées par défaut.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtre de cibles facultatif. Lorsqu’il est omis, la politique s’applique à toutes les cibles
  prises en charge afin que les nouvelles installations ne soient pas autorisées par défaut de manière inattendue.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Chemin absolu vers l’exécutable de politique approuvé. OpenClaw l’exécute sans
  shell et valide le chemin avant de l’utiliser.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Arguments statiques transmis après `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durée d’exécution réelle maximale d’une décision de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Durée maximale sans sortie sur stdout ou stderr avant le blocage par défaut
  de la politique.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Nombre maximal d’octets combinés de stdout et stderr acceptés du processus de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables d’environnement littérales fournies au processus de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Noms des variables d’environnement copiées du processus OpenClaw vers le
  processus de politique. Seules les variables nommées sont transmises.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Liste d’autorisation facultative des répertoires pouvant contenir l’exécutable de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Contourne les vérifications de propriété et d’autorisations du chemin de la commande. À utiliser uniquement lorsque le
  chemin est protégé par un autre mécanisme.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Autorise le chemin de commande configuré à être un lien symbolique. La cible résolue
  doit toujours satisfaire les autres vérifications de chemin. Les arguments de script d’interpréteur doivent
  être des fichiers ordinaires directs, et non des liens symboliques.
</ParamField>

La politique reçoit sur stdin un objet JSON comprenant `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
un champ structuré facultatif `source`, un champ structuré `origin` et `request`. Elle doit
écrire un objet JSON sur stdout : `{ "protocolVersion": 1, "decision": "allow" }`
ou `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Un code de sortie différent de zéro,
un dépassement de délai, un JSON mal formé, des champs manquants ou des versions de protocole
non prises en charge entraînent un blocage par défaut.

OpenClaw n’exécute pas la politique d’installation au démarrage normal du Gateway.
Les installations et les mises à jour sont bloquées par défaut lorsque la politique est activée mais indisponible.
`openclaw doctor` effectue une validation statique ; `openclaw doctor --deep`
exécute une sonde d’installation synthétique avec la commande configurée.

Les mises à jour groupées appliquent la politique à chaque cible : le blocage de la mise à jour d’un Skill ou d’un Plugin fait échouer
cette cible sans désactiver la politique ni ignorer les cibles suivantes du
lot.

Exemple d’entrée stdin :

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Commande de politique minimale :

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Liste d’autorisation des Skills intégrés

<ParamField path="skills.allowBundled" type="string[]">
  Liste d’autorisation facultative réservée aux Skills **intégrés**. Lorsqu’elle est définie, seuls les Skills intégrés
  figurant dans la liste sont admissibles. Les Skills gérés, propres aux agents et de l’espace de travail
  ne sont pas concernés.
</ParamField>

## Entrées par Skill (`skills.entries`)

Les clés sous `entries` correspondent par défaut au champ `name` du Skill. Si un Skill définit
`metadata.openclaw.skillKey`, utilisez cette clé à la place. Placez les noms contenant des traits d’union entre guillemets
(JSON5 autorise les clés entre guillemets).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` désactive le Skill, même s’il est intégré ou installé. Le Skill intégré
  `coding-agent` est facultatif : définissez-le sur `true` et assurez-vous que l’un des outils
  `claude`, `codex`, `opencode` ou une autre CLI prise en charge est installé et
  authentifié.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Accepte une chaîne en texte brut ou une SecretRef : `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles ne sont injectées que si la
  variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Ensemble facultatif de champs de configuration personnalisés propres au Skill.
</ParamField>

## Listes d’autorisation des agents (`agents`)

Utilisez la configuration de l’agent lorsque vous souhaitez conserver les mêmes racines de Skills pour la machine ou l’espace de travail,
mais définir un ensemble de Skills visibles différent pour chaque agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Liste d’autorisation de référence partagée, héritée par les agents qui omettent
  `agents.list[].skills`. Omettez-la entièrement pour ne pas restreindre les Skills
  par défaut.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Ensemble final explicite de Skills pour cet agent. Les listes explicites **remplacent**
  entièrement les valeurs par défaut héritées — elles ne sont pas fusionnées. Définissez ce champ sur `[]` pour n’exposer aucun Skill à
  cet agent.
</ParamField>

<Warning>
  Les listes d’autorisation de Skills des agents constituent un filtre de visibilité et de chargement pour la
  découverte des Skills par OpenClaw, les invites, la découverte des commandes slash, la synchronisation du bac à sable et les
  instantanés de Skills. Elles ne constituent pas une frontière d’autorisation lors de l’exécution du shell. Si un agent
  peut exécuter `exec` sur l’hôte, ce shell peut toujours lancer des clients externes ou lire
  les fichiers de l’hôte visibles par l’utilisateur d’exécution, notamment les registres de clients
  MCP tels que `~/.openclaw/skills/config/mcporter.json`. Pour
  isoler MCP par agent, combinez les listes d’autorisation de Skills avec une isolation par bac à sable ou utilisateur du système d’exploitation,
  interdisez l’exécution sur l’hôte ou limitez-la à une liste d’autorisation stricte, et privilégiez des
  identifiants propres à chaque agent sur le serveur MCP.
</Warning>

## Atelier (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Lorsque `true`, OpenClaw peut créer des propositions en attente à partir de corrections durables
  et peut examiner les travaux achevés substantiels et réussis une fois que le système devient
  inactif. Cela peut ajouter une exécution du modèle en arrière-plan après les tours admissibles. La création
  de Skills demandée par l’utilisateur et `/learn` continuent de fonctionner lorsque le paramètre est défini sur `false`.
</ParamField>

Consultez [Auto-apprentissage](/tools/self-learning) pour connaître les critères d’admissibilité, la confidentialité, le coût,
les autorisations limitées aux propositions et la résolution des problèmes.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` permet à l’agent d’appliquer, de rejeter ou de mettre en quarantaine sans
  demande d’approbation supplémentaire. `pending` exige l’approbation de l’opérateur.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Autorise l’application de Skill Workshop à écrire par l’intermédiaire des liens symboliques de Skills de l’espace de travail dont
  la cible réelle est déjà approuvée par `skills.load.allowSymlinkTargets`. Laissez
  cette option désactivée, sauf si l’application des propositions générées doit modifier cette racine
  de Skills partagée.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Nombre maximal de propositions en attente et mises en quarantaine conservées par espace de travail (plage
  autorisée : 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Taille maximale du corps d’une proposition en octets (plage autorisée : 1024-200000). Les descriptions
  des propositions sont plafonnées séparément à 160 octets, car elles apparaissent
  dans les résultats de découverte et de liste.
</ParamField>

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour connaître le cycle de vie des propositions, les commandes
CLI, les paramètres des outils de l’agent et les méthodes du Gateway contrôlés par cette configuration.

## Racines de Skills liées symboliquement

Par défaut, les racines de Skills de l’espace de travail, de l’agent de projet, des répertoires supplémentaires et des Skills intégrés constituent
des limites de confinement. Un dossier de Skill lié symboliquement sous `<workspace>/skills`
qui se résout hors de la racine est ignoré et un message est consigné dans le journal.

Pour autoriser intentionnellement une structure de liens symboliques, déclarez la cible approuvée :

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Avec cette configuration, `<workspace>/skills/manager -> ~/Projects/manager/skills`
est accepté après la résolution du chemin réel. `extraDirs` analyse directement le dépôt voisin ;
`allowSymlinkTargets` conserve le chemin lié symboliquement pour les structures
existantes.

Par défaut, l’application de Skill Workshop n’écrit pas par l’intermédiaire de ces liens symboliques. Pour
permettre à l’application de Workshop de modifier les Skills sous des cibles de liens symboliques déjà approuvées, activez
cette option séparément :

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Les répertoires `~/.openclaw/skills` gérés et `~/.agents/skills` personnels
acceptent déjà sans condition les liens symboliques vers des répertoires de Skills (le confinement
`SKILL.md` par Skill reste applicable) — `allowSymlinkTargets` n’est nécessaire
que pour les racines de l’espace de travail, des répertoires supplémentaires et de l’agent de projet (`<workspace>/.agents/skills`).

## Skills en bac à sable et variables d’environnement

<Warning>
  `skills.entries.<skill>.env` et `apiKey` s’appliquent uniquement aux exécutions sur **l’hôte**.
  Dans un bac à sable, ils n’ont aucun effet — un Skill qui dépend de
  `GEMINI_API_KEY` échouera avec `apiKey not configured`, sauf si la variable
  est fournie séparément au bac à sable.
</Warning>

Transmettez des secrets à un bac à sable Docker avec :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Les utilisateurs ayant accès au démon Docker peuvent consulter les valeurs `sandbox.docker.env`
  dans les métadonnées Docker. Utilisez un fichier secret monté, une image personnalisée ou
  une autre méthode de transmission si cette exposition n’est pas acceptable.
</Note>

## Rappel de l’ordre de chargement

```text
workspace/skills      (priorité la plus élevée)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills intégrés
skills.load.extraDirs (priorité la plus faible)
```

Les modifications apportées aux Skills et à la configuration prennent effet lors de la prochaine nouvelle session si
l’observateur est activé, ou lors du prochain tour de l’agent lorsque l’observateur détecte une
modification.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Référence des Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Présentation des Skills, ordre de chargement, contrôle d’accès et format SKILL.md.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Création de Skills personnalisés pour l’espace de travail.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigés par l’agent.
  </Card>
  <Card title="Auto-apprentissage" href="/tools/self-learning" icon="brain">
    Propositions prudentes et facultatives issues des travaux achevés.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue natif de commandes slash et directives de discussion.
  </Card>
</CardGroup>
