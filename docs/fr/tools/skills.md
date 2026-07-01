---
read_when:
    - Ajouter ou modifier des Skills
    - Modification du contrôle d’accès, des listes d’autorisation ou des règles de chargement des Skills
    - Comprendre la précédence des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: Skills apprennent à votre agent à utiliser des outils. Découvrez comment ils se chargent, comment fonctionne la précédence, et comment configurer le gating, les allowlists et l’injection d’environnement.
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:42:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills sont des fichiers d’instructions markdown qui enseignent à l’agent comment et quand utiliser
les outils. Chaque skill se trouve dans un répertoire contenant un fichier `SKILL.md` avec un
frontmatter YAML et un corps markdown. OpenClaw charge les Skills intégrées ainsi que toute
surcharge locale, puis les filtre au chargement selon l’environnement, la configuration et
la présence de binaires.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fr/tools/creating-skills" icon="hammer">
    Créer et tester une skill personnalisée à partir de zéro.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    Examiner et approuver les propositions de Skills rédigées par l’agent.
  </Card>
  <Card title="Skills config" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet et listes d’autorisation d’agents.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourir et installer les Skills de la communauté.
  </Card>
</CardGroup>

## Ordre de chargement

OpenClaw charge depuis ces sources, **par ordre de priorité décroissante**. Quand le même
nom de skill apparaît à plusieurs endroits, la source la plus prioritaire l’emporte.

| Priorité       | Source                         | Chemin                                  |
| -------------- | ------------------------------ | --------------------------------------- |
| 1 — maximale   | Skills de l’espace de travail  | `<workspace>/skills`                    |
| 2              | Skills d’agent du projet       | `<workspace>/.agents/skills`            |
| 3              | Skills d’agent personnelles    | `~/.agents/skills`                      |
| 4              | Skills gérées / locales        | `~/.openclaw/skills`                    |
| 5              | Skills intégrées               | fournies avec l’installation            |
| 6 — minimale   | Répertoires supplémentaires    | `skills.load.extraDirs` + Skills de Plugin |

Les racines de Skills prennent en charge les agencements groupés. OpenClaw découvre une skill dès que
`SKILL.md` apparaît n’importe où sous une racine configurée :

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Le chemin du dossier sert uniquement à l’organisation. Le nom de la skill, la commande slash et
la clé de liste d’autorisation proviennent tous du champ de frontmatter `name` (ou du nom du répertoire
quand `name` est absent).

<Note>
  Le répertoire natif `$CODEX_HOME/skills` de Codex CLI n’est **pas** une racine de
  Skills OpenClaw. Utilisez `openclaw migrate plan codex` pour inventorier ces Skills, puis
  `openclaw migrate codex` pour les copier dans votre espace de travail OpenClaw.
</Note>

## Skills par agent ou partagées

Dans les configurations multi-agent, chaque agent dispose de son propre espace de travail. Utilisez le chemin qui
correspond à la visibilité souhaitée :

| Portée              | Chemin                       | Visible par                         |
| ------------------- | ---------------------------- | ----------------------------------- |
| Par agent           | `<workspace>/skills`         | Uniquement cet agent                |
| Agent du projet     | `<workspace>/.agents/skills` | Uniquement l’agent de cet espace de travail |
| Agent personnel     | `~/.agents/skills`           | Tous les agents sur cette machine   |
| Gérées partagées    | `~/.openclaw/skills`         | Tous les agents sur cette machine   |
| Répertoires suppl.  | `skills.load.extraDirs`      | Tous les agents sur cette machine   |

## Listes d’autorisation d’agents

L’**emplacement** d’une skill (priorité) et sa **visibilité** (quel agent peut l’utiliser)
sont des contrôles distincts. Utilisez les listes d’autorisation pour restreindre les Skills qu’un agent voit,
indépendamment de leur source de chargement.

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

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Omettez `agents.defaults.skills` pour laisser toutes les Skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’exposer aucune skill à cet agent.
    - Une liste `agents.list[].skills` non vide est l’ensemble **final** — elle ne fusionne pas
      avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction du prompt, à la découverte des
      commandes slash, à la synchronisation du bac à sable et aux instantanés de Skills.
    - Ce n’est pas une limite d’autorisation du shell hôte. Si le même agent peut
      utiliser `exec`, contraignez ce shell séparément avec le sandboxing, l’isolation
      par utilisateur du système d’exploitation, les listes d’interdiction/autorisation d’exécution et les identifiants par ressource.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent fournir leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin se chargent
quand le Plugin est activé — par exemple, le Plugin de navigateur fournit une skill
`browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de Skills de Plugin fusionnent au même niveau de faible priorité que
`skills.load.extraDirs`, de sorte qu’une skill intégrée, gérée, d’agent ou d’espace de travail
portant le même nom les remplace. Encadrez-les via `metadata.openclaw.requires.config` sur l’entrée
de configuration du Plugin.

Consultez [Plugins](/fr/tools/plugin) et [Outils](/fr/tools) pour le système de Plugins complet.

## Skill Workshop

[Skill Workshop](/fr/tools/skill-workshop) est une file de propositions entre l’agent
et vos fichiers de Skills actifs. Quand l’agent repère un travail réutilisable, il rédige une
proposition au lieu d’écrire directement dans `SKILL.md`. Vous examinez et approuvez
avant toute modification.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Skill Workshop](/fr/tools/skill-workshop) pour le cycle de vie complet, la référence
CLI et la configuration.

## Installation depuis ClawHub

[ClawHub](https://clawhub.ai) est le registre public de Skills. Utilisez les commandes
`openclaw skills` pour installer et mettre à jour, ou la CLI `clawhub` pour publier
et synchroniser.

| Action                                      | Commande                                               |
| ------------------------------------------- | ------------------------------------------------------ |
| Installer une skill dans l’espace de travail | `openclaw skills install @owner/<slug>`                |
| Installer depuis un dépôt Git               | `openclaw skills install git:owner/repo@ref`           |
| Installer un répertoire de skill local      | `openclaw skills install ./path/to/skill --as my-tool` |
| Installer pour tous les agents locaux       | `openclaw skills install @owner/<slug> --global`       |
| Mettre à jour toutes les Skills de l’espace de travail | `openclaw skills update --all`                         |
| Mettre à jour une skill gérée partagée      | `openclaw skills update @owner/<slug> --global`        |
| Mettre à jour toutes les Skills gérées partagées | `openclaw skills update --all --global`                |
| Vérifier l’enveloppe de confiance d’une skill | `openclaw skills verify @owner/<slug>`                 |
| Afficher la Skill Card générée              | `openclaw skills verify @owner/<slug> --card`          |
| Publier / synchroniser via la CLI ClawHub   | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` installe par défaut dans le répertoire `skills/`
    de l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire partagé
    `~/.openclaw/skills`, visible par tous les agents locaux sauf si les listes
    d’autorisation d’agents le restreignent.

    Les installations Git et locales attendent `SKILL.md` à la racine de la source. Le slug provient
    du frontmatter `name` de `SKILL.md` lorsqu’il est valide, puis utilise en repli le
    nom du répertoire ou du dépôt. Utilisez `--as <slug>` pour le remplacer.
    `openclaw skills update` suit uniquement les installations ClawHub — réinstallez les sources Git ou
    locales pour les actualiser.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` demande à ClawHub l’enveloppe de confiance
    `clawhub.skill.verify.v1` de la skill. Les Skills ClawHub installées sont vérifiées
    par rapport à la version et au registre enregistrés dans `.clawhub/origin.json`.
    Les slugs nus restent acceptés pour les Skills déjà installées ou non ambiguës, mais
    les références qualifiées par propriétaire évitent l’ambiguïté sur l’éditeur.

    Les pages de Skills ClawHub exposent le dernier état d’analyse de sécurité avant installation,
    avec des pages de détail pour VirusTotal, ClawScan et l’analyse statique. La
    commande se termine avec un code non nul quand ClawHub marque la vérification comme échouée. Les éditeurs
    corrigent les faux positifs via le tableau de bord ClawHub ou
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Les clients Gateway qui ont besoin d’une livraison hors ClawHub peuvent préparer une archive zip de skill
    avec `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`,
    puis l’installer avec `skills.install({ source: "upload", ... })`. Ce chemin est
    désactivé par défaut et nécessite `skills.install.allowUploadedArchives: true` dans
    `openclaw.json`. Les installations ClawHub normales n’ont jamais besoin de ce paramètre.
  </Accordion>
</AccordionGroup>

## Sécurité

<Warning>
  Traitez les Skills tierces comme du **code non fiable**. Lisez-les avant de les activer.
  Préférez les exécutions en bac à sable pour les entrées non fiables et les outils risqués. Consultez
  [Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    La découverte de Skills d’espace de travail, d’agent de projet et de répertoires supplémentaires n’accepte que les racines de Skills
    dont le realpath résolu reste à l’intérieur de la racine configurée, sauf si
    `skills.load.allowSymlinkTargets` approuve explicitement une racine cible.
    Skill Workshop écrit via ces cibles de confiance uniquement quand
    `skills.workshop.allowSymlinkTargetWrites` est activé.
    Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills` peuvent contenir
    des dossiers de Skills liés par symlink, mais chaque realpath de `SKILL.md` doit tout de même rester
    dans son répertoire de skill résolu.
  </Accordion>
  <Accordion title="Operator install policy">
    Configurez `security.installPolicy` pour exécuter une commande de politique locale de confiance
    avant que les installations de Skills continuent. La politique reçoit les métadonnées et le chemin
    source préparé, s’applique aux chemins ClawHub, téléchargés, Git, locaux, de mise à jour et
    d’installation de dépendances, et échoue de manière fermée quand la commande ne peut pas renvoyer
    une décision valide.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` et `skills.entries.*.apiKey` injectent les secrets dans le
    processus **hôte** pour ce tour d’agent uniquement — pas dans le bac à sable. Gardez
    les secrets hors des prompts et des journaux.
  </Accordion>
</AccordionGroup>

Pour le modèle de menace plus large et les listes de contrôle de sécurité, consultez
[Sécurité](/fr/gateway/security).

## Format SKILL.md

Chaque skill nécessite au minimum un `name` et une `description` dans le frontmatter :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw suit la spécification [AgentSkills](https://agentskills.io). L’analyseur de
  frontmatter prend en charge **uniquement les clés sur une seule ligne** — `metadata` doit être un
  objet JSON sur une seule ligne. Utilisez `{baseDir}` dans le corps pour référencer le chemin du dossier
  de la skill.
</Note>

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Website » dans l’interface Skills macOS. Également prise en charge via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quand `true`, la skill est exposée comme commande slash invocable par l’utilisateur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quand `true`, OpenClaw garde les instructions de la skill hors du prompt normal
  de l’agent. La skill reste disponible comme commande slash quand `user-invocable`
  vaut aussi `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quand défini sur `tool`, la commande slash contourne le modèle et distribue
  directement vers un outil enregistré.
</ParamField>

<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer quand `command-dispatch: tool` est défini.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la distribution des outils, transmet la chaîne d’arguments brute à l’outil sans
  analyse par le noyau. L’outil reçoit
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Filtrage

OpenClaw filtre les skills au moment du chargement à l’aide de `metadata.openclaw` (JSON sur une seule ligne
dans le frontmatter). Une skill sans bloc `metadata.openclaw` est toujours
éligible sauf si elle est explicitement désactivée.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Quand la valeur est `true`, inclut toujours la skill et ignore toutes les autres conditions.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facultatif affiché dans l’interface Skills macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facultative affichée comme "Site web" dans l’interface Skills macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtre de plateforme. Quand il est défini, la skill n’est éligible que sur les OS listés.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Chaque binaire doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Au moins un binaire doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Chaque variable d’environnement doit exister dans le processus ou être fournie via la configuration.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Chaque chemin `openclaw.json` doit être truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spécifications d’installation facultatives utilisées par l’interface Skills macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Les anciens blocs `metadata.clawdbot` sont encore acceptés quand
  `metadata.openclaw` est absent, afin que les skills installées plus anciennes conservent leurs
  conditions de dépendance et leurs indications d’installation. Les nouvelles skills doivent utiliser
  `metadata.openclaw`.
</Note>

### Spécifications des installateurs

Les spécifications d’installation indiquent à l’interface Skills macOS comment installer une dépendance :

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Règles de sélection des installateurs">
    - Quand plusieurs installateurs sont listés, le Gateway choisit une option
      préférée (brew quand il est disponible, sinon node).
    - Si tous les installateurs sont `download`, OpenClaw liste chaque entrée pour que vous puissiez
      voir tous les artefacts disponibles.
    - Les spécifications peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json`
      (valeur par défaut : npm ; options : npm / pnpm / yarn / bun). Cela n’affecte que les installations de skills ;
      l’exécution du Gateway doit toujours utiliser Node.
    - Préférence d’installation du Gateway : Homebrew → uv → gestionnaire node configuré →
      go → download.
  </Accordion>
  <Accordion title="Détails par installateur">
    - **Homebrew :** OpenClaw n’installe pas automatiquement Homebrew et ne traduit pas les
      formules brew en commandes de paquet système. Dans les conteneurs Linux sans
      `brew`, les installateurs uniquement brew sont masqués ; utilisez une image personnalisée ou installez
      la dépendance manuellement.
    - **Go :** si `go` est absent et que `brew` est disponible, le gateway installe
      d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew.
    - **Téléchargement :** `url` (requis), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (par défaut : automatique quand une archive est détectée), `stripComponents`,
      `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notes sur le sandboxing">
    `requires.bins` est vérifié sur l’**hôte** au moment du chargement de la skill. Si un agent
    s’exécute dans une sandbox, le binaire doit aussi exister **dans le conteneur**.
    Installez-le via `agents.defaults.sandbox.docker.setupCommand` ou avec une image
    personnalisée. `setupCommand` s’exécute une fois après la création du conteneur et nécessite
    une sortie réseau, un système de fichiers racine accessible en écriture et un utilisateur root dans la sandbox.
  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Activez, désactivez et configurez les skills groupées ou gérées sous `skills.entries` dans
`~/.openclaw/openclaw.json` :

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` désactive la skill même lorsqu’elle est groupée ou installée. La skill groupée `coding-agent`
  est en opt-in — définissez `skills.entries.coding-agent.enabled: true`
  et assurez-vous que l’un de `claude`, `codex`, `opencode` ou une autre CLI prise en charge
  est installé et authentifié.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Champ de commodité pour les skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en texte clair ou un objet SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles ne sont injectées que lorsque la
  variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="config" type="object">
  Conteneur facultatif pour les champs de configuration personnalisés propres à chaque skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative pour les skills **groupées** uniquement. Lorsqu’elle est définie, seules les skills groupées
  dans la liste sont éligibles. Les skills gérées et de workspace ne sont pas affectées.
</ParamField>

<Note>
  Les clés de configuration correspondent au **nom de la skill** par défaut. Si une skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`. Placez
  les noms avec trait d’union entre guillemets : JSON5 autorise les clés entre guillemets.
</Note>

## Injection d’environnement

Quand une exécution d’agent démarre, OpenClaw :

<Steps>
  <Step title="Lit les métadonnées des skills">
    OpenClaw résout la liste effective des skills pour l’agent, en appliquant les règles
    de filtrage, les listes d’autorisation et les remplacements de configuration.
  </Step>
  <Step title="Injecte l’environnement et les clés API">
    `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` sont appliqués à
    `process.env` pendant la durée de l’exécution.
  </Step>
  <Step title="Construit le prompt système">
    Les skills éligibles sont compilées dans un bloc XML compact et injectées dans le
    prompt système.
  </Step>
  <Step title="Restaure l’environnement">
    Une fois l’exécution terminée, l’environnement d’origine est restauré.
  </Step>
</Steps>

<Warning>
  L’injection d’environnement est limitée à l’exécution de l’agent sur l’**hôte**, pas à la sandbox. Dans une
  sandbox, `env` et `apiKey` n’ont aucun effet. Consultez
  [Configuration des Skills](/fr/tools/skills-config#sandboxed-skills-and-env-vars) pour savoir
  comment transmettre des secrets aux exécutions sandboxées.
</Warning>

Pour le backend groupé `claude-cli`, OpenClaw matérialise aussi le même
instantané des skills éligibles sous forme de Plugin Claude Code temporaire et le transmet via
`--plugin-dir`. Les autres backends CLI utilisent uniquement le catalogue de prompts.

## Instantanés et actualisation

OpenClaw prend un instantané des skills éligibles **au démarrage d’une session** et réutilise cette
liste pour tous les tours suivants dans la session. Les modifications des skills ou de la configuration prennent
effet à la prochaine nouvelle session.

Les Skills sont actualisées en cours de session dans deux cas :

- Le watcher de skills détecte une modification de `SKILL.md`.
- Un nouveau nœud distant éligible se connecte.

La liste actualisée est prise en compte au prochain tour de l’agent. Si la liste d’autorisation effective de l’agent
change, OpenClaw actualise l’instantané afin de maintenir les skills visibles
alignées.

<AccordionGroup>
  <Accordion title="Watcher de Skills">
    Par défaut, OpenClaw surveille les dossiers de skills et incrémente l’instantané quand
    les fichiers `SKILL.md` changent. Configurez sous `skills.load` :

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Utilisez `allowSymlinkTargets` pour les dispositions avec liens symboliques intentionnelles où la racine d’une skill
    est un lien symbolique pointant hors de la racine configurée, par exemple
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Activez `skills.workshop.allowSymlinkTargetWrites` uniquement lorsque Skill Workshop
    doit aussi appliquer les propositions via ces chemins de liens symboliques approuvés.

  </Accordion>
  <Accordion title="Nœuds macOS distants (gateway Linux)">
    Si le Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté avec
    `system.run` autorisé, OpenClaw peut considérer les skills réservées à macOS comme éligibles lorsque
    les binaires requis sont présents sur ce nœud. L’agent doit exécuter ces
    skills via l’outil `exec` avec `host=node`.

    Les nœuds hors ligne ne rendent **pas** visibles les skills uniquement distantes. Si un nœud cesse
    de répondre aux sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache.

  </Accordion>
</AccordionGroup>

## Impact sur les tokens

Quand des skills sont éligibles, OpenClaw injecte un bloc XML compact dans le prompt
système. Le coût est déterministe :

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Surcoût de base** (uniquement lorsqu’il y a ≥ 1 skill) : environ 195 caractères
- **Par skill :** environ 97 caractères + les longueurs de vos champs `name`, `description` et `location`
- L’échappement XML développe `& < > " '` en entités, ce qui ajoute quelques caractères par occurrence
- À environ 4 caractères/token, 97 caractères ≈ 24 tokens par skill avant les longueurs de champs

Gardez les descriptions courtes et descriptives afin de réduire le surcoût du prompt.

## Liens connexes

<CardGroup cols={2}>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Guide pas à pas pour créer une skill personnalisée.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les skills rédigées par l’agent.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma complet de configuration `skills.*` et listes d’autorisation des agents.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Comment les commandes slash des skills sont enregistrées et routées.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des skills dans le registre public.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Les Plugins peuvent fournir des skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
