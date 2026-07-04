---
read_when:
    - Ajouter ou modifier des Skills
    - Modifier le contrôle des Skills, les listes d’autorisation ou les règles de chargement
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: Skills apprennent à votre agent à utiliser des outils. Découvrez comment ils se chargent, comment fonctionne la priorité, et comment configurer les contrôles d’accès, les listes d’autorisation et l’injection d’environnement.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills sont des fichiers d’instructions Markdown qui enseignent à l’agent comment et quand utiliser
les outils. Chaque skill se trouve dans un répertoire contenant un fichier `SKILL.md` avec un frontmatter
YAML et un corps Markdown. OpenClaw charge les Skills intégrés ainsi que toute
surcharge locale, et les filtre au moment du chargement selon l’environnement, la configuration et la
présence des binaires.

<CardGroup cols={2}>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Construire et tester une skill personnalisée à partir de zéro.
  </Card>
  <Card title="Atelier Skills" href="/fr/tools/skill-workshop" icon="flask">
    Examiner et approuver les propositions de skills rédigées par l’agent.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma complet de configuration `skills.*` et listes d’autorisation des agents.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourir et installer des skills communautaires.
  </Card>
</CardGroup>

## Ordre de chargement

OpenClaw charge depuis ces sources, **par ordre de priorité décroissante**. Lorsque le même
nom de skill apparaît à plusieurs endroits, la source ayant la priorité la plus élevée l’emporte.

| Priorité       | Source                         | Chemin                                  |
| -------------- | ------------------------------ | --------------------------------------- |
| 1 — maximale   | Skills de l’espace de travail  | `<workspace>/skills`                    |
| 2              | Skills d’agent de projet       | `<workspace>/.agents/skills`            |
| 3              | Skills d’agent personnelles    | `~/.agents/skills`                      |
| 4              | Skills gérées / locales        | `~/.openclaw/skills`                    |
| 5              | Skills intégrées               | livrées avec l’installation             |
| 6 — minimale   | Répertoires supplémentaires    | `skills.load.extraDirs` + Skills de plugin |

Les racines de Skills prennent en charge les mises en page groupées. OpenClaw découvre une skill chaque fois que
`SKILL.md` apparaît n’importe où sous une racine configurée :

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Le chemin du dossier sert uniquement à l’organisation. Le nom de la skill, la commande slash et
la clé de liste d’autorisation proviennent tous du champ frontmatter `name` (ou du nom du répertoire
lorsque `name` est absent).

<Note>
  Le répertoire natif `$CODEX_HOME/skills` de Codex CLI n’est **pas** une racine de
  skill OpenClaw. Utilisez `openclaw migrate plan codex` pour inventorier ces Skills, puis
  `openclaw migrate codex` pour les copier dans votre espace de travail OpenClaw.
</Note>

## Skills par agent et Skills partagées

Dans les configurations multi-agents, chaque agent possède son propre espace de travail. Utilisez le chemin qui
correspond à la visibilité souhaitée :

| Portée                 | Chemin                       | Visible par                          |
| ---------------------- | ---------------------------- | ------------------------------------ |
| Par agent              | `<workspace>/skills`         | Uniquement cet agent                 |
| Agent de projet        | `<workspace>/.agents/skills` | Uniquement l’agent de cet espace de travail |
| Agent personnel        | `~/.agents/skills`           | Tous les agents sur cette machine    |
| Géré partagé           | `~/.openclaw/skills`         | Tous les agents sur cette machine    |
| Répertoires supplémentaires | `skills.load.extraDirs`      | Tous les agents sur cette machine    |

## Listes d’autorisation des agents

L’**emplacement** d’une skill (priorité) et sa **visibilité** (quel agent peut l’utiliser)
sont des contrôles distincts. Utilisez les listes d’autorisation pour restreindre les Skills qu’un agent voit,
quel que soit l’endroit d’où elles sont chargées.

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
    - Omettez `agents.defaults.skills` pour laisser toutes les Skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’exposer aucune skill à cet agent.
    - Une liste `agents.list[].skills` non vide constitue l’ensemble **final** : elle ne
      fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction des prompts, à la
      découverte des commandes slash, à la synchronisation du sandbox et aux instantanés de skills.
    - Ce n’est pas une frontière d’autorisation du shell hôte. Si le même agent peut
      utiliser `exec`, restreignez ce shell séparément avec du sandboxing, l’isolation des utilisateurs OS,
      des listes d’interdiction/d’autorisation pour exec et des identifiants par ressource.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les plugins peuvent livrer leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du plugin). Les Skills de plugin se chargent
lorsque le plugin est activé ; par exemple, le plugin navigateur fournit une skill
`browser-automation` pour le contrôle du navigateur en plusieurs étapes.

Les répertoires de Skills de plugin fusionnent au même niveau de faible priorité que
`skills.load.extraDirs`, donc une skill intégrée, gérée, d’agent ou d’espace de travail portant le même nom
les remplace. Restreignez-les via `metadata.openclaw.requires.config` sur l’entrée de configuration
du plugin.

Consultez [Plugins](/fr/tools/plugin) et [Outils](/fr/tools) pour le système de plugins complet.

## Atelier Skills

[Atelier Skills](/fr/tools/skill-workshop) est une file de propositions entre l’agent
et vos fichiers de skills actifs. Lorsque l’agent repère un travail réutilisable, il rédige une
proposition au lieu d’écrire directement dans `SKILL.md`. Vous examinez et approuvez
avant tout changement.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [Atelier Skills](/fr/tools/skill-workshop) pour le cycle de vie complet, la référence
CLI et la configuration.

## Installation depuis ClawHub

[ClawHub](https://clawhub.ai) est le registre public de Skills. Utilisez les commandes
`openclaw skills` pour installer et mettre à jour, ou la CLI `clawhub` pour
publier et synchroniser.

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
| Imprimer la Skill Card générée              | `openclaw skills verify @owner/<slug> --card`          |
| Publier / synchroniser via la CLI ClawHub   | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Détails d’installation">
    `openclaw skills install` installe par défaut dans le répertoire `skills/`
    de l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire partagé
    `~/.openclaw/skills`, visible par tous les agents locaux sauf restriction par les
    listes d’autorisation d’agents.

    Les installations Git et locales attendent `SKILL.md` à la racine de la source. Le slug provient
    du frontmatter `name` de `SKILL.md` lorsqu’il est valide, puis se rabat sur le
    nom du répertoire ou du dépôt. Utilisez `--as <slug>` pour le remplacer.
    `openclaw skills update` suit uniquement les installations ClawHub : réinstallez les sources Git ou
    locales pour les actualiser.

  </Accordion>
  <Accordion title="Vérification et analyse de sécurité">
    `openclaw skills verify @owner/<slug>` demande à ClawHub l’enveloppe de confiance
    `clawhub.skill.verify.v1` de la skill. Les Skills ClawHub installées se vérifient
    par rapport à la version et au registre enregistrés dans `.clawhub/origin.json`.
    Les slugs nus restent acceptés pour les Skills existantes installées ou non ambiguës, mais
    les références qualifiées par propriétaire évitent l’ambiguïté de l’éditeur.

    Les pages de skills ClawHub exposent le dernier état d’analyse de sécurité avant l’installation,
    avec des pages de détail pour VirusTotal, ClawScan et l’analyse statique. La
    commande se termine avec un code non nul lorsque ClawHub marque la vérification comme échouée. Les éditeurs
    corrigent les faux positifs via le tableau de bord ClawHub ou
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installations d’archives privées">
    Les clients Gateway qui ont besoin d’une distribution hors ClawHub peuvent préparer une archive zip de skill
    avec `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`,
    puis l’installer avec `skills.install({ source: "upload", ... })`. Ce chemin est
    désactivé par défaut et nécessite `skills.install.allowUploadedArchives: true` dans
    `openclaw.json`. Les installations ClawHub normales n’ont jamais besoin de ce paramètre.
  </Accordion>
</AccordionGroup>

## Sécurité

<Warning>
  Traitez les Skills tierces comme du **code non fiable**. Lisez-les avant de les activer.
  Privilégiez les exécutions en sandbox pour les entrées non fiables et les outils risqués. Consultez
  [Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

<AccordionGroup>
  <Accordion title="Confinement des chemins">
    La découverte des Skills d’espace de travail, d’agent de projet et de répertoire supplémentaire n’accepte que les racines de skills
    dont le chemin réel résolu reste dans la racine configurée, sauf si
    `skills.load.allowSymlinkTargets` approuve explicitement une racine cible.
    Atelier Skills écrit via ces cibles approuvées uniquement lorsque
    `skills.workshop.allowSymlinkTargetWrites` est activé.
    Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills` peuvent contenir
    des dossiers de skills liés symboliquement, mais chaque chemin réel de `SKILL.md` doit toujours rester
    dans son répertoire de skill résolu.
  </Accordion>
  <Accordion title="Politique d’installation de l’opérateur">
    Configurez `security.installPolicy` pour exécuter une commande de politique locale approuvée
    avant la poursuite des installations de skills. La politique reçoit les métadonnées et le chemin
    source préparé, s’applique aux chemins ClawHub, téléversé, Git, local, de mise à jour et
    d’installation de dépendances, et échoue de manière fermée lorsque la commande ne peut pas retourner
    une décision valide.
  </Accordion>
  <Accordion title="Portée de l’injection de secrets">
    `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le
    processus **hôte** pour ce tour d’agent uniquement, pas dans le sandbox. Gardez
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
  frontmatter prend en charge les **clés sur une seule ligne uniquement** : `metadata` doit être un
  objet JSON sur une seule ligne. Utilisez `{baseDir}` dans le corps pour référencer le chemin du dossier
  de la skill.
</Note>

### Clés frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme "Site web" dans l’UI macOS Skills. Également prise en charge via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, la skill est exposée comme commande slash invocable par l’utilisateur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, OpenClaw garde les instructions de la skill hors du prompt normal
  de l’agent. La skill reste disponible comme commande slash lorsque `user-invocable`
  vaut également `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Lorsqu’elle est définie sur `tool`, la commande slash contourne le modèle et est distribuée
  directement à un outil enregistré.
</ParamField>

<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la répartition des outils, transmet la chaîne d'arguments brute à l'outil sans
  analyse par le noyau. L'outil reçoit
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Contrôle d'éligibilité

OpenClaw filtre les Skills au moment du chargement avec `metadata.openclaw` (JSON
sur une seule ligne dans le frontmatter). Un Skill sans bloc `metadata.openclaw` est toujours
éligible sauf s'il est explicitement désactivé.

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
  Quand `true`, inclut toujours le Skill et ignore tous les autres contrôles.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facultatif affiché dans l'interface Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facultative affichée comme « Site web » dans l'interface Skills de macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtre de plateforme. Quand il est défini, le Skill n'est éligible que sur les systèmes d'exploitation listés.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Chaque binaire doit exister sur `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Au moins un binaire doit exister sur `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Chaque variable d'environnement doit exister dans le processus ou être fournie via la configuration.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Chaque chemin `openclaw.json` doit être truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nom de variable d'environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spécifications d'installation facultatives utilisées par l'interface Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Les anciens blocs `metadata.clawdbot` sont toujours acceptés quand
  `metadata.openclaw` est absent, afin que les anciens Skills installés conservent leurs
  contrôles de dépendances et leurs indications d'installation. Les nouveaux Skills doivent utiliser
  `metadata.openclaw`.
</Note>

### Spécifications d'installation

Les spécifications d'installation indiquent à l'interface Skills de macOS comment installer une dépendance :

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
  <Accordion title="Installer selection rules">
    - Quand plusieurs programmes d'installation sont listés, le Gateway choisit une
      option préférée (`brew` si disponible, sinon `node`).
    - Si tous les programmes d'installation sont `download`, OpenClaw liste chaque entrée afin que vous puissiez
      voir tous les artefacts disponibles.
    - Les spécifications peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json`
      (valeur par défaut : npm ; options : npm / pnpm / yarn / bun). Cela n'affecte que les
      installations de Skills ; le runtime Gateway doit toujours être Node.
    - Préférence d'installation du Gateway : Homebrew → uv → gestionnaire node configuré →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew :** OpenClaw n'installe pas automatiquement Homebrew et ne traduit pas les
      formules brew en commandes de paquet système. Dans les conteneurs Linux sans
      `brew`, les programmes d'installation exclusivement brew sont masqués ; utilisez une image personnalisée ou installez
      la dépendance manuellement.
    - **Go :** OpenClaw nécessite Go 1.21 ou une version plus récente pour les installations automatiques de Skills et
      conserve les paramètres `GOBIN`, `GOPATH` et `GOTOOLCHAIN` existants. Si la
      chaîne d'outils configurée ne peut pas satisfaire la version Go requise par un module,
      l'onboarding groupe le Skill avec les prérequis Go manuels après la tentative
      d'installation. Si `go` est absent et que Homebrew est disponible, OpenClaw installe
      d'abord Go via Homebrew et définit `GOBIN` sur le répertoire `bin` de Homebrew. Sur Linux,
      OpenClaw peut plutôt utiliser `apt-get` en tant que root ou via `sudo` sans mot de passe
      lorsque le candidat `golang-go` actualisé satisfait la version minimale.
    - **Download :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (valeur par défaut : automatique lorsqu'une archive est détectée), `stripComponents`,
      `targetDir` (valeur par défaut : `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` est vérifié sur l'**hôte** au moment du chargement du Skill. Si un agent
    s'exécute dans un bac à sable, le binaire doit aussi exister **dans le conteneur**.
    Installez-le via `agents.defaults.sandbox.docker.setupCommand` ou une image
    personnalisée. `setupCommand` s'exécute une fois après la création du conteneur et nécessite
    une sortie réseau, un système de fichiers racine inscriptible et un utilisateur root dans le bac à sable.
  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Activez/désactivez et configurez les Skills groupés ou gérés sous `skills.entries` dans
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
  `false` désactive le Skill même lorsqu'il est groupé ou installé. Le Skill groupé `coding-agent`
  est opt-in — définissez `skills.entries.coding-agent.enabled: true`
  et assurez-vous que `claude`, `codex`, `opencode` ou une autre CLI prise en charge
  est installé et authentifié.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Champ de commodité pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en texte clair ou un objet SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables d'environnement injectées pour l'exécution de l'agent. Elles ne sont injectées que lorsque la
  variable n'est pas déjà définie dans le processus.
</ParamField>

<ParamField path="config" type="object">
  Conteneur facultatif pour les champs de configuration personnalisés par Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Liste d'autorisation facultative pour les Skills **groupés** uniquement. Quand elle est définie, seuls les Skills groupés
  dans la liste sont éligibles. Les Skills gérés et de l'espace de travail ne sont pas affectés.
</ParamField>

<Note>
  Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
  `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`. Mettez
  les noms avec trait d'union entre guillemets : JSON5 autorise les clés entre guillemets.
</Note>

## Injection d'environnement

Quand une exécution d'agent démarre, OpenClaw :

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw résout la liste effective des Skills pour l'agent, en appliquant les règles
    de contrôle, les listes d'autorisation et les remplacements de configuration.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` sont appliqués à
    `process.env` pendant la durée de l'exécution.
  </Step>
  <Step title="Builds the system prompt">
    Les Skills éligibles sont compilés dans un bloc XML compact et injectés dans le
    prompt système.
  </Step>
  <Step title="Restores the environment">
    Une fois l'exécution terminée, l'environnement d'origine est restauré.
  </Step>
</Steps>

<Warning>
  L'injection d'environnement est limitée à l'exécution de l'agent sur l'**hôte**, pas au bac à sable. Dans un
  bac à sable, `env` et `apiKey` n'ont aucun effet. Consultez
  [Configuration des Skills](/fr/tools/skills-config#sandboxed-skills-and-env-vars) pour savoir comment
  transmettre des secrets aux exécutions en bac à sable.
</Warning>

Pour le backend groupé `claude-cli`, OpenClaw matérialise également le même
instantané de Skills éligibles sous forme de Plugin Claude Code temporaire et le transmet via
`--plugin-dir`. Les autres backends CLI utilisent uniquement le catalogue du prompt.

## Instantanés et actualisation

OpenClaw prend un instantané des Skills éligibles **au démarrage d'une session** et réutilise cette
liste pour tous les tours suivants de la session. Les modifications des Skills ou de la configuration prennent
effet à la prochaine nouvelle session.

Les Skills s'actualisent en milieu de session dans deux cas :

- Le surveillant des Skills détecte une modification de `SKILL.md`.
- Un nouveau nœud distant éligible se connecte.

La liste actualisée est prise en compte au prochain tour d'agent. Si la liste d'autorisation effective de l'agent
change, OpenClaw actualise l'instantané pour garder les Skills visibles
alignés.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l'instantané lorsque les fichiers
    `SKILL.md` changent. Configurez sous `skills.load` :

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

    Utilisez `allowSymlinkTargets` pour les dispositions de liens symboliques intentionnelles où un lien symbolique
    racine de Skill pointe en dehors de la racine configurée, par exemple
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Activez `skills.workshop.allowSymlinkTargetWrites` uniquement lorsque Skill Workshop
    doit aussi appliquer les propositions via ces chemins symboliques approuvés.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Si le Gateway s'exécute sur Linux mais qu'un **nœud macOS** est connecté avec
    `system.run` autorisé, OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque
    les binaires requis sont présents sur ce nœud. L'agent doit exécuter ces
    Skills via l'outil `exec` avec `host=node`.

    Les nœuds hors ligne ne rendent **pas** les Skills disponibles uniquement à distance visibles. Si un nœud cesse de
    répondre aux sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache.

  </Accordion>
</AccordionGroup>

## Impact sur les tokens

Lorsque des Skills sont éligibles, OpenClaw injecte un bloc XML compact dans le prompt
système. Le coût est déterministe :

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Surcoût de base** (uniquement quand ≥ 1 Skill) : ~195 caractères
- **Par Skill :** ~97 caractères + les longueurs de vos champs `name`, `description` et `location`
- L'échappement XML développe `& < > " '` en entités, ajoutant quelques caractères par occurrence
- À ~4 caractères/token, 97 caractères ≈ 24 tokens par Skill avant les longueurs des champs

Gardez les descriptions courtes et explicites pour minimiser le surcoût du prompt.

## Connexe

<CardGroup cols={2}>
  <Card title="Creating skills" href="/fr/tools/creating-skills" icon="hammer">
    Guide étape par étape pour créer un Skill personnalisé.
  </Card>
  <Card title="Skill Workshop" href="/fr/tools/skill-workshop" icon="flask">
    File de propositions pour les Skills rédigés par l'agent.
  </Card>
  <Card title="Skills config" href="/fr/tools/skills-config" icon="gear">
    Schéma complet de configuration `skills.*` et listes d'autorisation des agents.
  </Card>
  <Card title="Slash commands" href="/fr/tools/slash-commands" icon="terminal">
    Comment les commandes slash des Skills sont enregistrées et routées.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des Skills dans le registre public.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Les Plugins peuvent distribuer des Skills avec les outils qu'ils documentent.
  </Card>
</CardGroup>
