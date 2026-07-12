---
read_when:
    - Configuration du chargement, de l’installation ou des conditions d’activation des Skills
    - Configuration de la visibilité des Skills par agent
    - Ajustement des limites de l’atelier de Skills ou de la politique d’approbation
sidebarTitle: Skills config
summary: Référence complète du schéma de configuration `skills.*`, des listes d’autorisation des agents, des paramètres de l’atelier et de la gestion des variables d’environnement du bac à sable.
title: Configuration des Skills
x-i18n:
    generated_at: "2026-07-12T15:59:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

La majeure partie de la configuration des Skills se trouve sous `skills` dans
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
      approvalPolicy: "pending",
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
  Répertoires de Skills supplémentaires à analyser, avec la priorité la plus faible
  (après les Skills intégrés et ceux des Plugins). Les chemins prennent en charge
  le développement de `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Répertoires cibles réels et approuvés vers lesquels les dossiers de Skills liés
  symboliquement peuvent être résolus, même lorsque le lien symbolique se trouve
  hors de la racine configurée. Utilisez cette option pour des dispositions
  intentionnelles de dépôts frères telles que
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Limitez strictement
  cette liste — ne ciblez pas de racines étendues comme `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Surveille les dossiers de Skills et actualise l’instantané des Skills lorsque
  les fichiers `SKILL.md` changent. Couvre les fichiers imbriqués sous les racines
  de Skills regroupées.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Fenêtre d’anti-rebond en millisecondes pour les événements de surveillance des Skills.
</ParamField>

## Installation (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Privilégie les programmes d’installation Homebrew lorsque `brew` est disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Préférence de gestionnaire de paquets Node pour l’installation des Skills. Cela
  concerne uniquement l’installation des Skills — l’environnement d’exécution du
  Gateway doit continuer à utiliser Node (Bun n’est pas recommandé pour
  WhatsApp/Telegram). `openclaw setup --node-manager` et
  `openclaw onboard --node-manager` acceptent `npm`, `pnpm` ou `bun` ; définissez
  directement `"yarn"` dans la configuration pour les installations de Skills
  reposant sur Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Autorise les clients Gateway `operator.admin` approuvés à installer des archives
  zip privées préparées via `skills.upload.*`. Les installations ClawHub ordinaires
  ne nécessitent pas ce paramètre.
</ParamField>

## Politique d’installation de l’opérateur (`security.installPolicy`)

Utilisez `security.installPolicy` lorsque les opérateurs ont besoin d’une commande
locale approuvée pour autoriser ou bloquer l’installation de Skills et de Plugins
selon une politique propre à l’hôte. La politique s’exécute après qu’OpenClaw a
préparé les sources et avant la poursuite de l’installation ou de la mise à jour.
Elle s’applique aux Skills ClawHub, aux Skills téléversés, aux Skills Git/locaux,
aux programmes d’installation des dépendances de Skills ainsi qu’aux sources
d’installation et de mise à jour des Plugins.

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
  Active la politique d’installation gérée par l’opérateur. Lorsqu’elle est activée
  sans commande `exec` valide, les installations échouent de manière fermée.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtre de cibles facultatif. Lorsqu’il est omis, la politique s’applique à toutes
  les cibles prises en charge afin que les nouvelles installations ne soient pas
  autorisées de manière inattendue en cas d’échec.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Chemin absolu vers l’exécutable de politique approuvé. OpenClaw l’exécute sans
  interpréteur de commandes et valide le chemin avant utilisation.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Arguments statiques transmis après `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durée maximale en temps réel d’une décision de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Durée maximale sans sortie sur stdout ou stderr avant que la politique échoue
  de manière fermée.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Nombre maximal combiné d’octets de stdout et stderr acceptés du processus de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables d’environnement littérales fournies au processus de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Noms des variables d’environnement copiées du processus OpenClaw vers le
  processus de politique. Seules les variables nommées sont transmises.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Liste d’autorisation facultative des répertoires pouvant contenir l’exécutable de stratégie.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Contourne les vérifications de propriété et d’autorisations du chemin de la commande. À utiliser uniquement lorsque le
  chemin est protégé par un autre mécanisme.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Autorise le chemin de commande configuré à être un lien symbolique. La cible résolue
  doit toujours satisfaire les autres vérifications de chemin. Les arguments de script de l’interpréteur doivent
  être des fichiers ordinaires directs, et non des liens symboliques.
</ParamField>

La stratégie reçoit sur stdin un objet JSON contenant `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
un objet structuré `source` facultatif, un objet structuré `origin` et `request`. Elle doit
écrire sur stdout un objet JSON : `{ "protocolVersion": 1, "decision": "allow" }`
ou `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Une sortie avec un code différent de zéro,
un dépassement du délai, un JSON mal formé, des champs manquants ou des versions de protocole
non prises en charge entraînent un blocage par défaut.

OpenClaw n’exécute pas la stratégie d’installation lors du démarrage normal du Gateway.
Les installations et les mises à jour sont bloquées par défaut lorsque la stratégie est activée mais indisponible.
`openclaw doctor` effectue une validation statique ; `openclaw doctor --deep`
exécute une sonde d’installation synthétique sur la commande configurée.

Les mises à jour groupées appliquent la stratégie à chaque cible : la mise à jour bloquée d’une skill ou d’un plugin échoue
pour cette cible sans désactiver la stratégie ni ignorer les cibles suivantes du
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

Commande de stratégie minimale :

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
        reason: "les chemins locaux de plugins ne sont pas approuvés sur cet hôte",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Liste d’autorisation des Skills intégrées

<ParamField path="skills.allowBundled" type="string[]">
  Liste d’autorisation facultative réservée aux Skills **intégrées**. Lorsqu’elle est définie, seules les Skills intégrées
  figurant dans la liste sont admissibles. Les Skills gérées, au niveau de l’agent et de l’espace de travail
  ne sont pas affectées.
</ParamField>

## Entrées par Skills (`skills.entries`)

Les clés sous `entries` correspondent par défaut au `name` de la Skills. Si une Skills définit
`metadata.openclaw.skillKey`, utilisez plutôt cette clé. Mettez entre guillemets les noms contenant des traits d’union
(JSON5 autorise les clés entre guillemets).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` désactive la Skills, même lorsqu’elle est intégrée ou installée. La Skills intégrée
  `coding-agent` est facultative — définissez-la sur `true` et assurez-vous que l’une des CLI
  `claude`, `codex`, `opencode` ou une autre CLI prise en charge est installée et
  authentifiée.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Accepte une chaîne en texte brut ou une SecretRef : `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables d’environnement injectées lors de l’exécution de l’agent. Elles ne sont injectées que si la
  variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Conteneur facultatif pour les champs de configuration personnalisés propres à chaque Skills.
</ParamField>

## Listes d’autorisation des agents (`agents`)

Utilisez la configuration des agents lorsque vous souhaitez conserver les mêmes racines de Skills de machine/d’espace de travail, mais
afficher un ensemble de Skills différent pour chaque agent.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // référence commune
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace entièrement les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucune Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Liste d’autorisation de référence commune héritée par les agents qui omettent
  `agents.list[].skills`. Omettez-la entièrement pour ne pas restreindre les Skills par
  défaut.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Ensemble final explicite de Skills pour cet agent. Les listes explicites **remplacent**
  les valeurs par défaut héritées — elles ne sont pas fusionnées. Définissez-le sur `[]` pour n’exposer aucune Skills à
  cet agent.
</ParamField>

<Warning>
  Les listes d’autorisation de Skills des agents constituent un filtre de visibilité et de chargement pour la
  découverte des Skills par OpenClaw, les prompts, la découverte des commandes slash, la synchronisation du bac à sable et les
  instantanés des Skills. Elles ne constituent pas une frontière d’autorisation au moment de l’exécution du shell. Si un agent
  peut exécuter `exec` sur l’hôte, ce shell peut toujours exécuter des clients externes ou lire
  les fichiers de l’hôte visibles par l’utilisateur d’exécution, y compris les registres de clients MCP
  tels que `~/.openclaw/skills/config/mcporter.json`. Pour isoler MCP par agent,
  combinez les listes d’autorisation de Skills avec l’isolation par bac à sable/utilisateur du système d’exploitation,
  interdisez l’exécution sur l’hôte ou limitez-la strictement par liste d’autorisation, et privilégiez des
  identifiants propres à chaque agent sur le serveur MCP.
</Warning>

## Atelier (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Lorsque cette option vaut `true`, les agents peuvent créer des propositions en attente à partir de signaux de conversation
  persistants après des tours réussis. La création de Skills demandée par l’utilisateur passe toujours
  par Skill Workshop, quel que soit ce paramètre.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` exige l’approbation de l’opérateur avant qu’une application, un rejet
  ou une mise en quarantaine soit déclenché par un agent. `auto` autorise ces actions sans approbation.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Autorise l’application par Skill Workshop à écrire via les liens symboliques des Skills de l’espace de travail dont
  la cible réelle est déjà approuvée par `skills.load.allowSymlinkTargets`. Laissez
  cette option désactivée sauf si l’application des propositions générées doit modifier cette racine
  de Skills partagée.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Nombre maximal de propositions en attente et mises en quarantaine conservées par espace de travail (plage
  autorisée : 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Taille maximale du corps d’une proposition en octets (plage autorisée : 1024-200000). Les descriptions
  des propositions sont plafonnées séparément à 160 octets, car elles apparaissent
  dans les sorties de découverte et de liste.
</ParamField>

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour connaître le cycle de vie des propositions, les commandes
CLI, les paramètres des outils d’agent et les méthodes du Gateway contrôlés par cette configuration.

## Racines de Skills liées symboliquement

Par défaut, les racines de Skills de l’espace de travail, de l’agent de projet, des répertoires supplémentaires et des Skills intégrés constituent
des limites de confinement. Un dossier de Skill lié symboliquement sous `<workspace>/skills`
qui se résout en dehors de la racine est ignoré avec un message dans le journal.

Pour autoriser intentionnellement une disposition utilisant des liens symboliques, déclarez la cible approuvée :

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
est accepté après la résolution du chemin réel. `extraDirs` analyse directement le dépôt frère ;
`allowSymlinkTargets` préserve le chemin lié symboliquement pour les dispositions
existantes.

Par défaut, l’application par Skill Workshop n’écrit pas via ces liens symboliques. Pour
permettre à Workshop de modifier les Skills situés sous des cibles de liens symboliques déjà approuvées, activez
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

Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills`
acceptent déjà sans condition les liens symboliques vers des répertoires de Skills (le confinement de
`SKILL.md` propre à chaque Skill s’applique toujours) — `allowSymlinkTargets` n’est nécessaire
que pour les racines de l’espace de travail, des répertoires supplémentaires et de l’agent de projet (`<workspace>/.agents/skills`).

## Skills en bac à sable et variables d’environnement

<Warning>
  `skills.entries.<skill>.env` et `apiKey` s’appliquent uniquement aux exécutions sur l’**hôte**.
  Dans un bac à sable, ils n’ont aucun effet — un Skill qui dépend de
  `GEMINI_API_KEY` échouera avec `apiKey not configured`, sauf si la variable est
  fournie séparément au bac à sable.
</Warning>

Transmettez les secrets à un bac à sable Docker avec :

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
  Les utilisateurs ayant accès au démon Docker peuvent inspecter les valeurs de `sandbox.docker.env`
  dans les métadonnées Docker. Utilisez un fichier de secrets monté, une image personnalisée ou
  une autre méthode de transmission lorsque cette exposition n’est pas acceptable.
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

## Contenu associé

<CardGroup cols={2}>
  <Card title="Référence des Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Présentation des Skills, ordre de chargement, conditions d’activation et format de SKILL.md.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Création de Skills d’espace de travail personnalisés.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File d’attente des propositions de Skills rédigées par les agents.
  </Card>
  <Card title="Commandes à barre oblique" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue natif de commandes à barre oblique et directives de chat.
  </Card>
</CardGroup>
