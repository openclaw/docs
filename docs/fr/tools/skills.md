---
read_when:
    - Ajouter ou modifier des Skills
    - Modification du filtrage, des listes d’autorisation ou des règles de chargement des Skills
    - Comprendre la priorité des Skills et le comportement des snapshots
sidebarTitle: Skills
summary: Skills indiquent à votre agent comment utiliser les outils. Découvrez comment elles se chargent, comment fonctionne la précédence, et comment configurer les conditions d’activation, les listes d’autorisation et l’injection d’environnement.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Les Skills sont des fichiers d’instructions Markdown qui apprennent à l’agent comment et quand utiliser
les outils. Chaque Skill réside dans un répertoire contenant un fichier `SKILL.md` avec un frontmatter
YAML et un corps Markdown. OpenClaw charge les Skills intégrés ainsi que les éventuelles substitutions
locales, et les filtre au chargement selon l’environnement, la configuration et la présence des
binaires.

<CardGroup cols={2}>
  <Card title="Créer des Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez et testez un Skill personnalisé à partir de zéro.
  </Card>
  <Card title="Atelier Skill" href="/fr/tools/skill-workshop" icon="flask">
    Examinez et approuvez les propositions de Skills rédigées par l’agent.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet et listes d’autorisation des agents.
  </Card>
  <Card title="ClawHub" href="/fr/clawhub" icon="cloud">
    Parcourez et installez des Skills communautaires.
  </Card>
</CardGroup>

## Ordre de chargement

OpenClaw charge depuis ces sources, par **ordre de priorité décroissant**. Quand le même
nom de Skill apparaît à plusieurs endroits, la source la plus prioritaire l’emporte.

| Priorité       | Source                 | Chemin                                  |
| -------------- | ---------------------- | --------------------------------------- |
| 1 — maximale   | Skills de l’espace de travail | `<workspace>/skills`                    |
| 2              | Skills d’agent du projet | `<workspace>/.agents/skills`            |
| 3              | Skills d’agent personnels | `~/.agents/skills`                      |
| 4              | Skills gérés / locaux  | `~/.openclaw/skills`                    |
| 5              | Skills intégrés        | livrés avec l’installation              |
| 6 — minimale   | Répertoires supplémentaires | `skills.load.extraDirs` + Skills de Plugins |

Les racines de Skills prennent en charge les dispositions groupées. OpenClaw découvre un Skill dès que
`SKILL.md` apparaît n’importe où sous une racine configurée :

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Le chemin du dossier sert uniquement à l’organisation. Le nom du Skill, la commande slash et
la clé de liste d’autorisation proviennent tous du champ de frontmatter `name` (ou du nom du répertoire
quand `name` est absent).

<Note>
  Le répertoire natif `$CODEX_HOME/skills` de Codex CLI n’est **pas** une racine de Skills
  OpenClaw. Utilisez `openclaw migrate plan codex` pour inventorier ces Skills, puis
  `openclaw migrate codex` pour les copier dans votre espace de travail OpenClaw.
</Note>

## Skills par agent et Skills partagés

Dans les configurations multi-agents, chaque agent dispose de son propre espace de travail. Utilisez le chemin qui
correspond à la visibilité souhaitée :

| Portée         | Chemin                       | Visible par                  |
| -------------- | ---------------------------- | --------------------------- |
| Par agent      | `<workspace>/skills`         | Uniquement cet agent         |
| Agent du projet | `<workspace>/.agents/skills` | Uniquement l’agent de cet espace de travail |
| Agent personnel | `~/.agents/skills`           | Tous les agents sur cette machine |
| Géré partagé   | `~/.openclaw/skills`         | Tous les agents sur cette machine |
| Répertoires supplémentaires | `skills.load.extraDirs`      | Tous les agents sur cette machine |

## Listes d’autorisation des agents

L’**emplacement** du Skill (priorité) et sa **visibilité** (quel agent peut l’utiliser)
sont des contrôles distincts. Utilisez les listes d’autorisation pour restreindre les Skills qu’un agent voit,
quel que soit leur emplacement de chargement.

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
  <Accordion title="Règles de liste d’autorisation">
    - Omettez `agents.defaults.skills` pour laisser tous les Skills non restreints par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’exposer aucun Skill à cet agent.
    - Une liste `agents.list[].skills` non vide est l’ensemble **final** — elle ne
      fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction du prompt, à la découverte des
      commandes slash, à la synchronisation du sandbox et aux instantanés de Skills.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent livrer leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin se chargent
quand le Plugin est activé — par exemple, le Plugin de navigateur livre un Skill
`browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de Skills de Plugin fusionnent au même niveau de faible priorité que
`skills.load.extraDirs`, donc un Skill intégré, géré, d’agent ou d’espace de travail portant le même nom
les remplace. Restreignez-les via `metadata.openclaw.requires.config` sur l’entrée de configuration
du Plugin.

Consultez [Plugins](/fr/tools/plugin) et [Outils](/fr/tools) pour le système complet de Plugins.

## Atelier Skill

[L’Atelier Skill](/fr/tools/skill-workshop) est une file de propositions entre l’agent
et vos fichiers de Skills actifs. Quand l’agent repère un travail réutilisable, il rédige une
proposition au lieu d’écrire directement dans `SKILL.md`. Vous examinez et approuvez
avant toute modification.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Atelier Skill](/fr/tools/skill-workshop) pour le cycle de vie complet, la référence
CLI et la configuration.

## Installation depuis ClawHub

[ClawHub](https://clawhub.ai) est le registre public de Skills. Utilisez les commandes
`openclaw skills` pour l’installation et la mise à jour, ou la CLI `clawhub` pour
publier et synchroniser.

| Action                             | Commande                                               |
| ---------------------------------- | ------------------------------------------------------ |
| Installer un Skill dans l’espace de travail | `openclaw skills install @owner/<slug>`                |
| Installer depuis un dépôt Git      | `openclaw skills install git:owner/repo@ref`           |
| Installer un répertoire de Skill local | `openclaw skills install ./path/to/skill --as my-tool` |
| Installer pour tous les agents locaux | `openclaw skills install @owner/<slug> --global`       |
| Mettre à jour tous les Skills de l’espace de travail | `openclaw skills update --all`                         |
| Mettre à jour un Skill géré partagé | `openclaw skills update @owner/<slug> --global`        |
| Mettre à jour tous les Skills gérés partagés | `openclaw skills update --all --global`                |
| Vérifier l’enveloppe de confiance d’un Skill | `openclaw skills verify @owner/<slug>`                 |
| Afficher la Skill Card générée     | `openclaw skills verify @owner/<slug> --card`          |
| Publier / synchroniser via la CLI ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Détails d’installation">
    `openclaw skills install` installe par défaut dans le répertoire `skills/`
    de l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire partagé
    `~/.openclaw/skills`, visible par tous les agents locaux sauf si les listes
    d’autorisation des agents le restreignent.

    Les installations Git et locales attendent `SKILL.md` à la racine source. Le slug provient
    du frontmatter `name` de `SKILL.md` quand il est valide, puis se rabat sur le
    nom du répertoire ou du dépôt. Utilisez `--as <slug>` pour le remplacer.
    `openclaw skills update` suit uniquement les installations ClawHub — réinstallez les sources Git ou
    locales pour les actualiser.

  </Accordion>
  <Accordion title="Vérification et analyse de sécurité">
    `openclaw skills verify @owner/<slug>` demande à ClawHub l’enveloppe de confiance
    `clawhub.skill.verify.v1` du Skill. Les Skills ClawHub installés sont vérifiés
    par rapport à la version et au registre enregistrés dans `.clawhub/origin.json`.
    Les slugs nus restent acceptés pour les Skills existants installés ou non ambigus, mais
    les références qualifiées par propriétaire évitent l’ambiguïté d’éditeur.

    Les pages de Skills ClawHub exposent l’état de la dernière analyse de sécurité avant l’installation,
    avec des pages de détail pour VirusTotal, ClawScan et l’analyse statique. La
    commande se termine avec un code non nul quand ClawHub marque la vérification comme échouée. Les éditeurs
    corrigent les faux positifs via le tableau de bord ClawHub ou
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installations d’archives privées">
    Les clients Gateway qui ont besoin d’une livraison hors ClawHub peuvent préparer une archive zip de Skill
    avec `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`,
    puis l’installer avec `skills.install({ source: "upload", ... })`. Ce chemin est
    désactivé par défaut et nécessite `skills.install.allowUploadedArchives: true` dans
    `openclaw.json`. Les installations ClawHub normales n’ont jamais besoin de ce réglage.
  </Accordion>
</AccordionGroup>

## Sécurité

<Warning>
  Traitez les Skills tiers comme du **code non approuvé**. Lisez-les avant de les activer.
  Préférez les exécutions en sandbox pour les entrées non approuvées et les outils risqués. Consultez
  [Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

<AccordionGroup>
  <Accordion title="Confinement des chemins">
    La découverte des Skills d’espace de travail, d’agent de projet et de répertoire supplémentaire n’accepte que les racines de Skills
    dont le realpath résolu reste à l’intérieur de la racine configurée, sauf si
    `skills.load.allowSymlinkTargets` approuve explicitement une racine cible.
    L’Atelier Skill écrit via ces cibles approuvées uniquement quand
    `skills.workshop.allowSymlinkTargetWrites` est activé.
    Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills` peuvent contenir
    des dossiers de Skills liés par symlink, mais chaque realpath de `SKILL.md` doit toujours rester
    à l’intérieur de son répertoire de Skill résolu.
  </Accordion>
  <Accordion title="Politique d’installation de l’opérateur">
    Configurez `security.installPolicy` pour exécuter une commande de politique locale approuvée
    avant que les installations de Skills ne continuent. La politique reçoit les métadonnées et le chemin
    source préparé, s’applique à ClawHub, aux sources téléversées, Git, locales, aux mises à jour et aux
    chemins d’installation des dépendances, et échoue en mode fermé quand la commande ne peut pas renvoyer
    une décision valide.
  </Accordion>
  <Accordion title="Portée de l’injection de secrets">
    `skills.entries.*.env` et `skills.entries.*.apiKey` injectent les secrets dans le
    processus **hôte** uniquement pour ce tour d’agent — pas dans le sandbox. Gardez
    les secrets hors des prompts et des journaux.
  </Accordion>
</AccordionGroup>

Pour le modèle de menace plus large et les listes de contrôle de sécurité, consultez
[Sécurité](/fr/gateway/security).

## Format de SKILL.md

Chaque Skill nécessite au minimum un `name` et une `description` dans le frontmatter :

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
  du Skill.
</Note>

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme "Site web" dans l’interface macOS Skills. Également prise en charge via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quand `true`, le Skill est exposé comme une commande slash invocable par l’utilisateur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quand `true`, OpenClaw garde les instructions du Skill hors du prompt normal
  de l’agent. Le Skill reste disponible comme commande slash quand `user-invocable`
  vaut également `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quand ce champ est défini sur `tool`, la commande slash contourne le modèle et déclenche
  directement un outil enregistré.
</ParamField>

<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer quand `command-dispatch: tool` est défini.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la répartition vers un outil, transmet la chaîne brute d’arguments à l’outil sans
  analyse par le noyau. L’outil reçoit
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Conditions d’activation

OpenClaw filtre les Skills au moment du chargement à l’aide de `metadata.openclaw` (JSON sur une seule ligne
dans le frontmatter). Un Skill sans bloc `metadata.openclaw` est toujours
éligible sauf s’il est explicitement désactivé.

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
  Lorsque `true`, inclut toujours le Skill et ignore toutes les autres portes.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facultatif affiché dans l’interface macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  URL facultative affichée comme « Site web » dans l’interface macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtre de plateforme. Lorsqu’il est défini, le Skill n’est éligible que sur les OS listés.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Chaque binaire doit exister sur `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Au moins un binaire doit exister sur `PATH`.
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
  Spécifications d’installation facultatives utilisées par l’interface macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  Les anciens blocs `metadata.clawdbot` sont encore acceptés lorsque
  `metadata.openclaw` est absent, afin que les anciens Skills installés conservent leurs
  portes de dépendances et leurs indications d’installation. Les nouveaux Skills doivent utiliser
  `metadata.openclaw`.
</Note>

### Spécifications d’installation

Les spécifications d’installation indiquent à l’interface macOS Skills comment installer une dépendance :

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
  <Accordion title="Règles de sélection de l’installateur">
    - Lorsque plusieurs installateurs sont listés, le Gateway choisit une
      option préférée (brew lorsqu’il est disponible, sinon node).
    - Si tous les installateurs sont `download`, OpenClaw liste chaque entrée afin que vous puissiez
      voir tous les artefacts disponibles.
    - Les spécifications peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json`
      (par défaut : npm ; options : npm / pnpm / yarn / bun). Cela n’affecte que les installations de Skills ;
      l’environnement d’exécution Gateway doit toujours être Node.
    - Préférence d’installateur du Gateway : Homebrew → uv → gestionnaire node configuré →
      go → download.
  </Accordion>
  <Accordion title="Détails par installateur">
    - **Homebrew :** OpenClaw n’installe pas automatiquement Homebrew et ne traduit pas les
      formules brew en commandes de paquets système. Dans les conteneurs Linux sans
      `brew`, les installateurs uniquement brew sont masqués ; utilisez une image personnalisée ou installez
      la dépendance manuellement.
    - **Go :** si `go` est absent et que `brew` est disponible, le Gateway installe
      d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew.
    - **Download :** `url` (requis), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (par défaut : automatique lorsqu’une archive est détectée), `stripComponents`,
      `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Notes sur le sandboxing">
    `requires.bins` est vérifié sur l’**hôte** au moment du chargement du Skill. Si un agent
    s’exécute dans un bac à sable, le binaire doit aussi exister **dans le conteneur**.
    Installez-le via `agents.defaults.sandbox.docker.setupCommand` ou une image personnalisée.
    `setupCommand` s’exécute une fois après la création du conteneur et nécessite
    une sortie réseau, un FS racine accessible en écriture et un utilisateur root dans le bac à sable.
  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Activez, désactivez et configurez les Skills intégrés ou gérés sous `skills.entries` dans
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
  `false` désactive le Skill même lorsqu’il est intégré ou installé. Le Skill intégré `coding-agent`
  est opt-in — définissez `skills.entries.coding-agent.enabled: true`
  et assurez-vous que l’un de `claude`, `codex`, `opencode` ou une autre CLI prise en charge
  est installé et authentifié.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en texte clair ou un objet SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles ne sont injectées que lorsque la
  variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="config" type="object">
  Conteneur facultatif pour les champs de configuration personnalisés propres à chaque Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Allowlist facultative pour les Skills **intégrés** uniquement. Lorsqu’elle est définie, seuls les Skills intégrés
  dans la liste sont éligibles. Les Skills gérés et de workspace ne sont pas affectés.
</ParamField>

<Note>
  Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`. Mettez les
  noms avec trait d’union entre guillemets : JSON5 autorise les clés entre guillemets.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

<Steps>
  <Step title="Lit les métadonnées du Skill">
    OpenClaw résout la liste effective des Skills pour l’agent, en appliquant les règles
    de portes, les allowlists et les remplacements de configuration.
  </Step>
  <Step title="Injecte l’environnement et les clés API">
    `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` sont appliqués à
    `process.env` pendant la durée de l’exécution.
  </Step>
  <Step title="Construit le prompt système">
    Les Skills éligibles sont compilés dans un bloc XML compact et injectés dans le
    prompt système.
  </Step>
  <Step title="Restaure l’environnement">
    Une fois l’exécution terminée, l’environnement d’origine est restauré.
  </Step>
</Steps>

<Warning>
  L’injection d’environnement est limitée à l’exécution de l’agent sur l’**hôte**, pas au bac à sable. À l’intérieur d’un
  bac à sable, `env` et `apiKey` n’ont aucun effet. Consultez
  [Configuration des Skills](/fr/tools/skills-config#sandboxed-skills-and-env-vars) pour savoir comment
  transmettre des secrets aux exécutions en bac à sable.
</Warning>

Pour le backend intégré `claude-cli`, OpenClaw matérialise aussi le même
instantané des Skills éligibles comme Plugin Claude Code temporaire et le transmet via
`--plugin-dir`. Les autres backends CLI utilisent uniquement le catalogue de prompts.

## Instantanés et actualisation

OpenClaw capture les Skills éligibles **lorsqu’une session démarre** et réutilise cette
liste pour tous les tours suivants de la session. Les modifications apportées aux Skills ou à la configuration prennent
effet à la nouvelle session suivante.

Les Skills s’actualisent en milieu de session dans deux cas :

- Le watcher des Skills détecte une modification de `SKILL.md`.
- Un nouveau nœud distant éligible se connecte.

La liste actualisée est prise en compte au prochain tour d’agent. Si l’allowlist effective de l’agent
change, OpenClaw actualise l’instantané pour maintenir les Skills visibles
alignés.

<AccordionGroup>
  <Accordion title="Watcher des Skills">
    Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané lorsque
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

    Utilisez `allowSymlinkTargets` pour les dispositions avec liens symboliques intentionnelles où un
    lien symbolique de racine de Skill pointe en dehors de la racine configurée, par exemple
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Activez `skills.workshop.allowSymlinkTargetWrites` uniquement lorsque Skill Workshop
    doit aussi appliquer des propositions via ces chemins de liens symboliques de confiance.

  </Accordion>
  <Accordion title="Nœuds macOS distants (Gateway Linux)">
    Si le Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté avec
    `system.run` autorisé, OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque
    les binaires requis sont présents sur ce nœud. L’agent doit exécuter ces
    Skills via l’outil `exec` avec `host=node`.

    Les nœuds hors ligne ne rendent **pas** visibles les Skills uniquement distants. Si un nœud cesse de
    répondre aux sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache.

  </Accordion>
</AccordionGroup>

## Impact sur les tokens

Lorsque des Skills sont éligibles, OpenClaw injecte un bloc XML compact dans le
prompt système. Le coût est déterministe :

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Surcoût de base** (uniquement lorsqu’il y a ≥ 1 Skill) : ~195 caractères
- **Par Skill :** ~97 caractères + les longueurs de vos champs `name`, `description` et `location`
- L’échappement XML transforme `& < > " '` en entités, ajoutant quelques caractères par occurrence
- À ~4 caractères/token, 97 caractères ≈ 24 tokens par Skill avant les longueurs des champs

Gardez des descriptions courtes et descriptives pour minimiser le surcoût du prompt.

## Connexe

<CardGroup cols={2}>
  <Card title="Créer des Skills" href="/fr/tools/creating-skills" icon="hammer">
    Guide étape par étape pour créer un Skill personnalisé.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigés par des agents.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma complet de configuration `skills.*` et allowlists d’agents.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Comment les commandes slash de Skill sont enregistrées et routées.
  </Card>
  <Card title="ClawHub" href="/fr/clawhub" icon="cloud">
    Parcourir et publier des Skills dans le registre public.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Les Plugins peuvent fournir des Skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
