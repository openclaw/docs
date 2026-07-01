---
read_when:
    - Configurer le comportement de chargement, d’installation ou de contrôle d’accès des Skills
    - Définir la visibilité des Skills par agent
    - Ajuster les limites de Skill Workshop ou la politique d’approbation
sidebarTitle: Skills config
summary: Référence complète pour le schéma de configuration skills.*, les listes d’autorisation d’agents, les paramètres d’atelier et la gestion des variables d’environnement du bac à sable.
title: Configuration Skills
x-i18n:
    generated_at: "2026-07-01T05:41:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

La majeure partie de la configuration des Skills se trouve sous `skills` dans
`~/.openclaw/openclaw.json`. La visibilité propre aux agents se trouve sous
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
  ainsi que l’outil principal `image_generate` au lieu de `skills.entries`. Les
  entrées de Skills servent uniquement aux workflows de Skills personnalisés ou tiers.
</Note>

## Chargement (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Répertoires de Skills supplémentaires à analyser, avec la priorité la plus
  basse (après les Skills groupés et de Plugin). Les chemins sont développés avec
  la prise en charge de `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Répertoires cibles réels et approuvés vers lesquels les dossiers de Skills sous
  forme de liens symboliques peuvent résoudre, même lorsque le lien symbolique se
  trouve hors de la racine configurée. Utilisez ceci pour les dispositions
  intentionnelles de dépôts voisins, comme
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Gardez cette liste
  restreinte — ne la faites pas pointer vers des racines larges comme `~` ou `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Surveille les dossiers de Skills et actualise l’instantané des Skills lorsque
  les fichiers `SKILL.md` changent. Couvre les fichiers imbriqués sous les
  racines de Skills groupées.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Fenêtre d’anti-rebond pour les événements de surveillance des Skills, en millisecondes.
</ParamField>

## Installation (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Privilégie les installateurs Homebrew lorsque `brew` est disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Préférence de gestionnaire de paquets Node pour les installations de Skills.
  Cela n’affecte que les installations de Skills — le runtime Gateway doit
  toujours utiliser Node (Bun n’est pas recommandé pour WhatsApp/Telegram).
  Utilisez `openclaw setup --node-manager` pour npm, pnpm ou bun ; définissez
  `"yarn"` manuellement pour les installations de Skills reposant sur Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Autorise les clients Gateway `operator.admin` approuvés à installer des archives
  zip privées préparées via `skills.upload.*`. Les installations ClawHub normales
  n’ont pas besoin de ce paramètre.
</ParamField>

## Politique d’installation opérateur (`security.installPolicy`)

Utilisez `security.installPolicy` lorsque les opérateurs ont besoin d’une
commande locale approuvée pour autoriser ou bloquer les installations de Skills
et de Plugins avec une politique propre à l’hôte. La politique s’exécute après
qu’OpenClaw a préparé les sources et avant que l’installation ou la mise à jour
ne continue. Elle s’applique aux Skills ClawHub, aux Skills téléversés, aux
Skills Git/locaux, aux installateurs de dépendances de Skills et aux sources
d’installation/mise à jour de Plugins.

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
  Active la politique d’installation détenue par l’opérateur. Lorsqu’elle est
  activée sans commande `exec` valide, les installations échouent en mode fermé.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtre de cible facultatif. Lorsqu’il est omis, la politique s’applique à
  toutes les cibles prises en charge afin que les nouvelles installations ne
  s’ouvrent pas de façon inattendue.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Chemin absolu vers l’exécutable de politique approuvé. OpenClaw l’exécute sans
  shell et valide le chemin avant utilisation.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Arguments statiques transmis après `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Durée maximale en temps réel pour une décision de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Durée maximale sans sortie stdout ou stderr avant que la politique échoue en
  mode fermé.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Nombre maximal d’octets stdout et stderr combinés acceptés depuis le processus
  de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables d’environnement littérales fournies au processus de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Noms des variables d’environnement copiées du processus OpenClaw vers le
  processus de politique. Seules les variables nommées sont transmises.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Liste d’autorisation facultative des répertoires pouvant contenir l’exécutable
  de politique.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Contourne les vérifications de propriété et d’autorisations du chemin de la
  commande. À utiliser uniquement lorsque le chemin est protégé par un autre mécanisme.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Autorise le chemin de commande configuré à être un lien symbolique. La cible
  résolue doit tout de même satisfaire les autres vérifications de chemin. Les
  arguments de script d’interpréteur doivent être des fichiers réguliers directs,
  et non des liens symboliques.
</ParamField>

La politique reçoit un objet JSON sur stdin avec `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
un champ structuré facultatif `source`, ainsi que `origin` et `request`
structurés. Elle doit écrire un objet JSON sur stdout :
`{ "protocolVersion": 1, "decision": "allow" }` ou
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Une sortie non
nulle, un délai d’expiration, un JSON mal formé, des champs manquants ou des
versions de protocole non prises en charge échouent en mode fermé.

OpenClaw n’exécute pas la politique d’installation pendant le démarrage normal
du Gateway. Les installations et mises à jour échouent en mode fermé lorsque la
politique est activée mais indisponible. `openclaw doctor` effectue une
validation statique, et `openclaw doctor --deep` exécute une sonde
d’installation synthétique contre la commande configurée.

Les mises à jour en masse appliquent la politique par cible : une mise à jour de
Skill ou de Plugin bloquée échoue pour cette cible sans désactiver la politique
ni ignorer les cibles suivantes du lot.

Exemple stdin :

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

## Liste d’autorisation des Skills groupés

<ParamField path="skills.allowBundled" type="string[]">
  Liste d’autorisation facultative pour les Skills **groupés** uniquement. Une
  fois définie, seuls les Skills groupés de la liste sont éligibles. Les Skills
  gérés, au niveau de l’agent et de l’espace de travail ne sont pas affectés.
</ParamField>

## Entrées par Skill (`skills.entries`)

Les clés sous `entries` correspondent par défaut au `name` du Skill. Si un Skill
définit `metadata.openclaw.skillKey`, utilisez cette clé à la place. Mettez les
noms avec trait d’union entre guillemets (JSON5 autorise les clés entre guillemets).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` désactive le Skill même lorsqu’il est groupé ou installé. Le Skill
  groupé `coding-agent` est opt-in — définissez-le sur `true` et assurez-vous
  que l’un de `claude`, `codex`, `opencode` ou une autre CLI prise en charge est
  installé et authentifié.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en clair ou un SecretRef : `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles sont
  injectées uniquement lorsque la variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Conteneur facultatif pour les champs de configuration personnalisés par Skill.
</ParamField>

## Listes d’autorisation des agents (`agents`)

Utilisez la configuration d’agent lorsque vous voulez les mêmes racines de
Skills pour une machine/un espace de travail, mais un ensemble de Skills visible
différent par agent.

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
  Liste d’autorisation de référence partagée héritée par les agents qui omettent
  `agents.list[].skills`. Omettez-la entièrement pour laisser les Skills sans
  restriction par défaut.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Ensemble final explicite de Skills pour cet agent. Les listes explicites
  **remplacent** les valeurs par défaut héritées — elles ne fusionnent pas.
  Définissez sur `[]` pour n’exposer aucun Skill à cet agent.
</ParamField>

<Warning>
  Les listes d’autorisation de Skills d’agent sont un filtre de visibilité et de
  chargement pour la découverte des Skills OpenClaw, les prompts, la découverte
  des commandes slash, la synchronisation du sandbox et les instantanés de
  Skills. Elles ne constituent pas une frontière d’autorisation au moment du
  shell. Si un agent peut exécuter `exec` sur l’hôte, ce shell peut toujours
  lancer des clients externes ou lire des fichiers hôte visibles pour
  l’utilisateur d’exécution, y compris des registres de clients MCP comme
  `~/.openclaw/skills/config/mcporter.json`. Pour l’isolation MCP par agent,
  combinez les listes d’autorisation de Skills avec l’isolation par sandbox ou
  utilisateur du système d’exploitation, refusez ou restreignez strictement
  `exec` sur l’hôte, et privilégiez les identifiants par agent au niveau du
  serveur MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Lorsque `true`, les agents peuvent créer des propositions en attente à partir
  de signaux de conversation durables après des tours réussis. La création de
  Skills demandée par l’utilisateur passe toujours par Skill Workshop, quel que
  soit ce paramètre.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` exige l’approbation de l’opérateur avant une application, un rejet ou
  une mise en quarantaine initiés par l’agent. `auto` autorise ces actions sans approbation.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Autoriser l’application de Skill Workshop à écrire à travers les liens symboliques
  de Skills de l’espace de travail dont la cible réelle est déjà approuvée par
  `skills.load.allowSymlinkTargets`. Gardez cette option désactivée sauf si les
  applications de propositions générées doivent modifier cette racine de Skill
  partagée.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Nombre maximal de propositions en attente et mises en quarantaine conservées par espace de travail.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Taille maximale du corps de proposition en octets. Les descriptions de
  propositions sont strictement limitées à 160 octets, car elles apparaissent
  dans la découverte et la sortie de listage.
</ParamField>

## Racines de Skills liées par lien symbolique

Par défaut, les racines de Skills d’espace de travail, d’agent de projet, de
répertoire supplémentaire et groupées sont des limites de confinement. Un
dossier de Skill lié par lien symbolique sous `<workspace>/skills` qui se résout
en dehors de la racine est ignoré avec un message de journal.

Pour autoriser une disposition intentionnelle avec lien symbolique, déclarez la cible approuvée :

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

Avec cette configuration, `<workspace>/skills/manager -> ~/Projects/manager/skills` est
accepté après résolution realpath. `extraDirs` analyse directement le dépôt
voisin ; `allowSymlinkTargets` préserve le chemin lié par lien symbolique pour
les dispositions existantes.

Par défaut, l’application de Skill Workshop n’écrit pas à travers ces liens
symboliques. Pour permettre à Workshop apply de modifier des Skills sous des
cibles de liens symboliques déjà approuvées, activez cette option séparément :

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
acceptent déjà les liens symboliques de répertoires de Skills (le confinement
`SKILL.md` par Skill s’applique toujours).

## Skills sandboxés et variables d’environnement

<Warning>
  `skills.entries.<skill>.env` et `apiKey` s’appliquent uniquement aux exécutions
  **hôte**. Dans un sandbox, ils n’ont aucun effet — un Skill qui dépend de
  `GEMINI_API_KEY` échouera avec `apiKey not configured` sauf si la variable est
  fournie séparément au sandbox.
</Warning>

Transmettez des secrets à un sandbox Docker avec :

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
  Les utilisateurs ayant accès au daemon Docker peuvent inspecter les valeurs
  `sandbox.docker.env` via les métadonnées Docker. Utilisez un fichier secret
  monté, une image personnalisée ou un autre chemin de livraison lorsque cette
  exposition n’est pas acceptable.
</Note>

## Rappel de l’ordre de chargement

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Les modifications apportées aux Skills et à la configuration prennent effet lors
de la nouvelle session suivante lorsque le watcher est activé, ou lors du tour
d’agent suivant lorsque le watcher détecte une modification.

## Associés

<CardGroup cols={2}>
  <Card title="Skills reference" href="/fr/tools/skills" icon="puzzle-piece">
    Ce que sont les Skills, l’ordre de chargement, le gating et le format SKILL.md.
  </Card>
  <Card title="Creating skills" href="/fr/tools/creating-skills" icon="hammer">
    Création de Skills d’espace de travail personnalisés.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigés par l’agent.
  </Card>
  <Card title="Slash commands" href="/fr/tools/slash-commands" icon="terminal">
    Catalogue natif de commandes slash et directives de chat.
  </Card>
</CardGroup>
