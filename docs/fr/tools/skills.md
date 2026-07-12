---
read_when:
    - Ajout ou modification de Skills
    - Modification du filtrage, des listes d’autorisation ou des règles de chargement des Skills
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: Les Skills apprennent à votre agent à utiliser les outils. Découvrez comment elles sont chargées, comment fonctionne la priorité et comment configurer les conditions d’activation, les listes d’autorisation et l’injection de variables d’environnement.
title: Skills
x-i18n:
    generated_at: "2026-07-12T03:25:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Les Skills sont des fichiers d’instructions Markdown qui enseignent à l’agent comment et quand utiliser
les outils. Chaque Skill réside dans un répertoire contenant un fichier `SKILL.md` avec un
frontmatter YAML et un corps Markdown. OpenClaw charge les Skills intégrés ainsi que les éventuelles
surcharges locales, puis les filtre au chargement selon l’environnement, la configuration et
la présence des binaires.

<CardGroup cols={2}>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez et testez un Skill personnalisé de zéro.
  </Card>
  <Card title="Atelier de Skills" href="/fr/tools/skill-workshop" icon="flask">
    Examinez et approuvez les propositions de Skills rédigées par l’agent.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet et listes d’autorisation des agents.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et installez les Skills de la communauté.
  </Card>
</CardGroup>

## Ordre de chargement

OpenClaw effectue le chargement depuis les sources suivantes, **par ordre de priorité décroissante**. Lorsque le même
nom de Skill apparaît à plusieurs endroits, la source de priorité la plus élevée l’emporte.

| Priorité       | Source                         | Chemin                                  |
| -------------- | ------------------------------ | --------------------------------------- |
| 1 — maximale   | Skills de l’espace de travail  | `<workspace>/skills`                    |
| 2              | Skills de l’agent du projet    | `<workspace>/.agents/skills`            |
| 3              | Skills personnels de l’agent   | `~/.agents/skills`                      |
| 4              | Skills gérés / locaux          | `~/.openclaw/skills`                    |
| 5              | Skills intégrés                | fournis avec l’installation             |
| 6 — minimale   | Répertoires supplémentaires    | `skills.load.extraDirs` + Skills des Plugins |

Les racines de Skills prennent en charge les structures groupées. OpenClaw découvre un Skill dès qu’un fichier
`SKILL.md` apparaît n’importe où sous une racine configurée, jusqu’à 6 niveaux de profondeur :

```text
<workspace>/skills/research/SKILL.md          ✓ trouvé sous le nom « research »
<workspace>/skills/personal/research/SKILL.md ✓ également trouvé sous le nom « research »
```

Le chemin du dossier sert uniquement à l’organisation. Le nom et la commande avec barre oblique du Skill
proviennent du champ `name` du frontmatter, ou du nom du répertoire lorsque `name` est
absent. Les listes d’autorisation des agents ci-dessous correspondent également à ce `name`.

<Note>
  Le répertoire natif `$CODEX_HOME/skills` de Codex CLI **n’est pas** une racine de
  Skills OpenClaw. Utilisez `openclaw migrate plan codex` pour inventorier ces Skills, puis
  `openclaw migrate codex` pour les copier dans votre espace de travail OpenClaw.
</Note>

## Skills hébergés par un Node

Un Node sans interface graphique connecté peut publier les Skills installés dans son répertoire actif de
Skills OpenClaw (`~/.openclaw/skills` par défaut ; les remplacements définis par l’environnement du profil
s’appliquent). Ils apparaissent dans la liste normale des Skills de l’agent tant que le Node est connecté
et disparaissent lorsqu’il se déconnecte. En cas de conflit, un Skill local ou du Gateway conserve son nom ;
le Skill du Node reçoit un nom déterministe préfixé par le Node.
La version v1 des Skills hébergés par un Node exige que le nom du répertoire corresponde au champ `name`
du frontmatter du Skill.

L’entrée du Skill inclut le localisateur du Node. Ses fichiers, références relatives et
binaires résident sur le Node ; chargez-le et exécutez-le donc avec
`exec host=node node=<node-id>`. Redémarrez l’hôte du Node après avoir modifié les fichiers
du Skill. Consultez [Nodes](/fr/nodes#node-hosted-skills) pour l’association et les mécanismes de désactivation.

## Skills propres à un agent ou partagés

Dans les configurations multi-agents, chaque agent possède son propre espace de travail. Utilisez le chemin qui
correspond à la visibilité souhaitée :

| Portée                      | Chemin                       | Visible par                             |
| --------------------------- | ---------------------------- | --------------------------------------- |
| Propre à l’agent            | `<workspace>/skills`         | Cet agent uniquement                    |
| Agent du projet             | `<workspace>/.agents/skills` | L’agent de cet espace de travail uniquement |
| Personnel à l’agent         | `~/.agents/skills`           | Tous les agents de cette machine        |
| Géré et partagé             | `~/.openclaw/skills`         | Tous les agents de cette machine        |
| Répertoires supplémentaires | `skills.load.extraDirs`      | Tous les agents de cette machine        |

## Listes d’autorisation des agents

L’**emplacement** du Skill, qui détermine sa priorité, et sa **visibilité**, qui détermine quel agent peut
l’utiliser, sont des contrôles distincts. Utilisez les listes d’autorisation pour limiter les Skills visibles par un agent,
quel que soit leur emplacement de chargement.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // base partagée
    },
    list: [
      { id: "writer" }, // hérite de github et weather
      { id: "docs", skills: ["docs-search"] }, // remplace entièrement les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Règles des listes d’autorisation">
    - Omettez `agents.defaults.skills` pour ne restreindre aucun Skill par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’exposer aucun Skill à cet agent.
    - Une liste `agents.list[].skills` non vide constitue l’ensemble **définitif** : elle n’est pas
      fusionnée avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction des prompts, à la découverte des
      commandes avec barre oblique, à la synchronisation du bac à sable et aux instantanés des Skills.
    - Il ne s’agit pas d’une frontière d’autorisation pour le shell de l’hôte. Si le même agent peut
      utiliser `exec`, limitez ce shell séparément au moyen d’un bac à sable, de l’isolation
      par utilisateur du système d’exploitation, de listes d’interdiction ou d’autorisation pour l’exécution et d’identifiants propres à chaque ressource.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent fournir leurs propres Skills en répertoriant des répertoires `skills` dans
`openclaw.plugin.json`, avec des chemins relatifs à la racine du Plugin. Les Skills d’un Plugin sont chargés
lorsque le Plugin est activé ; par exemple, le Plugin de navigateur fournit un Skill
`browser-automation` pour le contrôle du navigateur en plusieurs étapes.

Les répertoires de Skills des Plugins sont fusionnés au même niveau de faible priorité que
`skills.load.extraDirs`. Un Skill intégré, géré, propre à un agent ou à l’espace de travail portant le même nom
les remplace donc. Contrôlez l’éligibilité propre d’un Skill de Plugin au moyen de
`metadata.openclaw.requires` dans son frontmatter, comme pour tout autre Skill.

Consultez [Plugins](/fr/tools/plugin) et [Outils](/fr/tools) pour découvrir l’ensemble du système de Plugins.

## Atelier de Skills

L’[Atelier de Skills](/fr/tools/skill-workshop) est une file de propositions située entre l’agent
et vos fichiers de Skills actifs. Lorsque l’agent repère un travail réutilisable, il rédige une
proposition au lieu d’écrire directement dans `SKILL.md`. Vous l’examinez et l’approuvez
avant toute modification.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez l’[Atelier de Skills](/fr/tools/skill-workshop) pour connaître le cycle de vie complet, la référence de la
CLI et la configuration.

## Installation depuis ClawHub

[ClawHub](https://clawhub.ai) est le registre public des Skills. Utilisez les commandes
`openclaw skills` pour l’installation et la mise à jour, ou la CLI `clawhub` pour
la publication et la synchronisation.

| Action                                       | Commande                                               |
| -------------------------------------------- | ------------------------------------------------------ |
| Installer un Skill dans l’espace de travail  | `openclaw skills install @owner/<slug>`                |
| Installer depuis un dépôt Git                | `openclaw skills install git:owner/repo@ref`           |
| Installer un répertoire de Skill local       | `openclaw skills install ./path/to/skill --as my-tool` |
| Installer pour tous les agents locaux        | `openclaw skills install @owner/<slug> --global`       |
| Mettre à jour tous les Skills de l’espace de travail | `openclaw skills update --all`                  |
| Mettre à jour un Skill partagé et géré       | `openclaw skills update @owner/<slug> --global`        |
| Mettre à jour tous les Skills partagés et gérés | `openclaw skills update --all --global`             |
| Vérifier le périmètre de confiance d’un Skill | `openclaw skills verify @owner/<slug>`                |
| Afficher la fiche de Skill générée           | `openclaw skills verify @owner/<slug> --card`          |
| Publier / synchroniser via la CLI ClawHub    | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Détails de l’installation">
    Par défaut, `openclaw skills install` effectue l’installation dans le répertoire `skills/`
    de l’espace de travail actif. Ajoutez `--global` pour effectuer l’installation dans le répertoire partagé
    `~/.openclaw/skills`, visible par tous les agents locaux sauf si leurs listes
    d’autorisation le restreignent.

    Les installations Git et locales attendent un fichier `SKILL.md` à la racine de la source. L’identifiant court provient
    du champ `name` du frontmatter de `SKILL.md` lorsqu’il est valide, puis, à défaut, du
    nom du répertoire ou du dépôt. Utilisez `--as <slug>` pour le remplacer.
    `openclaw skills update` suit uniquement les installations ClawHub ; réinstallez les sources Git ou
    locales pour les actualiser.

  </Accordion>
  <Accordion title="Vérification et analyse de sécurité">
    `openclaw skills verify @owner/<slug>` demande à ClawHub le périmètre de confiance
    `clawhub.skill.verify.v1` du Skill. Les Skills ClawHub installés sont vérifiés
    par rapport à la version et au registre enregistrés dans `.clawhub/origin.json`.
    Les identifiants courts sans propriétaire restent acceptés pour les Skills déjà installés ou non ambigus, mais
    les références qualifiées par le propriétaire évitent toute ambiguïté concernant l’éditeur.

    Les pages de Skills ClawHub affichent l’état de la dernière analyse de sécurité avant l’installation,
    avec des pages détaillées pour VirusTotal, ClawScan et l’analyse statique. La
    commande renvoie un code de sortie non nul lorsque ClawHub indique que la vérification a échoué. Les éditeurs
    peuvent corriger les faux positifs depuis le tableau de bord ClawHub ou avec
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installations depuis une archive privée">
    Les clients du Gateway qui nécessitent une distribution hors de ClawHub peuvent préparer une archive ZIP de Skill
    avec `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`,
    puis l’installer avec `skills.install({ source: "upload", ... })`. Cette voie est
    désactivée par défaut et nécessite `skills.install.allowUploadedArchives: true` dans
    `openclaw.json`. Les installations ClawHub normales ne nécessitent jamais ce paramètre.
  </Accordion>
</AccordionGroup>

## Sécurité

<Warning>
  Considérez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
  Privilégiez les exécutions en bac à sable pour les entrées non fiables et les outils risqués. Consultez
  [Mise en bac à sable](/fr/gateway/sandboxing) pour connaître les contrôles côté agent.
</Warning>

<AccordionGroup>
  <Accordion title="Confinement des chemins">
    La découverte des Skills de l’espace de travail, de l’agent du projet et des répertoires supplémentaires accepte uniquement les
    racines de Skills dont le chemin réel résolu reste à l’intérieur de la racine configurée, sauf si
    `skills.load.allowSymlinkTargets` approuve explicitement une racine cible.
    L’Atelier de Skills écrit au travers de ces cibles approuvées uniquement lorsque
    `skills.workshop.allowSymlinkTargetWrites` est activé.
    Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills` peuvent contenir
    des dossiers de Skills liés symboliquement, mais le chemin réel de chaque fichier `SKILL.md` doit toujours rester
    dans le répertoire résolu de son Skill.
  </Accordion>
  <Accordion title="Politique d’installation de l’opérateur">
    Configurez `security.installPolicy` afin d’exécuter une commande de politique locale fiable
    avant de poursuivre l’installation des Skills. La politique reçoit les métadonnées et le chemin
    de la source préparée, s’applique aux installations ClawHub, aux téléversements, à Git, aux sources locales, aux mises à jour et
    aux chemins d’installation des dépendances, et refuse l’opération par défaut lorsque la commande ne peut pas renvoyer
    une décision valide.
  </Accordion>
  <Accordion title="Portée de l’injection des secrets">
    `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le
    processus de l’**hôte** uniquement pendant ce tour de l’agent, et non dans le bac à sable. N’incluez pas les
    secrets dans les prompts ni dans les journaux.
  </Accordion>
</AccordionGroup>

Pour consulter le modèle de menace général et les listes de contrôle de sécurité, voir
[Sécurité](/fr/gateway/security).

## Format de SKILL.md

Chaque Skill nécessite au minimum un `name` et une `description` dans le frontmatter :

```markdown
---
name: image-lab
description: Générer ou modifier des images au moyen d’un flux de travail d’image reposant sur un fournisseur
---

Lorsque l’utilisateur demande de générer une image, utilisez l’outil `image_generate`...
```

<Note>
  OpenClaw suit la spécification [AgentSkills](https://agentskills.io). Le frontmatter
  est d’abord analysé comme du YAML ; en cas d’échec, l’analyseur de secours
  n’accepte qu’une seule ligne. Les blocs `metadata` imbriqués (y compris les
  mappages YAML multilignes) sont aplatis en une chaîne JSON, puis réanalysés
  comme du JSON5 ; la forme de bloc présentée sous [Filtrage](#gating)
  fonctionne donc. Utilisez `{baseDir}` dans le corps pour référencer le chemin
  du dossier de la skill.
</Note>

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée sous le libellé "Website" dans l’interface Skills de macOS. Également
  prise en charge via `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque cette valeur est `true`, la skill est exposée comme une commande slash
  invocable par l’utilisateur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque cette valeur est `true`, OpenClaw exclut les instructions de la skill
  du prompt normal de l’agent. La skill reste disponible comme commande slash
  lorsque `user-invocable` vaut également `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Lorsque cette valeur est définie sur `tool`, la commande slash contourne le
  modèle et est envoyée directement à un outil enregistré.
</ParamField>

<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour l’envoi vers un outil, transmet la chaîne d’arguments brute à l’outil
  sans analyse par le cœur. L’outil reçoit
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Filtrage

OpenClaw filtre les skills lors du chargement à l’aide de `metadata.openclaw`
(objet JSON5 incorporé au frontmatter ; voir la note d’analyse ci-dessus). Une
skill dépourvue de bloc `metadata.openclaw` est toujours admissible, sauf si elle
est explicitement désactivée.

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
  Lorsque cette valeur est `true`, inclut toujours la skill et ignore tous les
  autres critères de filtrage.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facultatif affiché dans l’interface Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facultative affichée sous le libellé "Website" dans l’interface Skills de macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtre de plateforme. Lorsqu’il est défini, la skill n’est admissible que sur
  l’un des systèmes d’exploitation répertoriés.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Chaque exécutable doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Au moins un exécutable doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Chaque variable d’environnement doit exister dans le processus ou être fournie
  par la configuration.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Chaque chemin dans `openclaw.json` doit avoir une valeur évaluée comme vraie.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nom de la variable d’environnement associée à `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spécifications facultatives des programmes d’installation utilisées par
  l’interface Skills de macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Les anciens blocs `metadata.clawdbot` restent acceptés lorsque
  `metadata.openclaw` est absent, afin que les anciennes skills installées
  conservent leurs critères de dépendances et leurs indications d’installation.
  Les nouvelles skills doivent utiliser `metadata.openclaw`.
</Note>

### Spécifications des programmes d’installation

Les spécifications des programmes d’installation indiquent à l’interface Skills
de macOS comment installer une dépendance :

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
  <Accordion title="Règles de sélection du programme d’installation">
    - Lorsque plusieurs programmes d’installation sont répertoriés, le Gateway
      choisit l’option privilégiée (brew lorsqu’il est disponible, sinon node).
    - Si tous les programmes d’installation sont de type `download`, OpenClaw
      répertorie chaque entrée afin que vous puissiez voir tous les artefacts
      disponibles.
    - Les spécifications peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour
      appliquer un filtre par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans
      `openclaw.json` (valeur par défaut : npm ; options : npm / pnpm / yarn /
      bun). Cela concerne uniquement l’installation des skills ; l’environnement
      d’exécution du Gateway doit toujours être Node.
    - Ordre de préférence des programmes d’installation du Gateway : Homebrew
      → uv → gestionnaire de paquets node configuré → go → download.
  </Accordion>
  <Accordion title="Détails propres à chaque programme d’installation">
    - **Homebrew :** OpenClaw n’installe pas automatiquement Homebrew et ne
      traduit pas les formules brew en commandes du gestionnaire de paquets
      système. Dans les conteneurs Linux dépourvus de `brew`, les programmes
      d’installation exclusivement basés sur brew sont masqués ; utilisez une
      image personnalisée ou installez la dépendance manuellement.
    - **Go :** OpenClaw exige Go 1.21 ou une version plus récente pour
      l’installation automatique des skills. Si `go` est absent et que
      Homebrew est disponible, OpenClaw installe d’abord Go via Homebrew ; sous
      Linux sans Homebrew, il peut à la place utiliser `apt-get` en tant que
      superutilisateur ou via un `sudo` sans mot de passe lorsque la version
      candidate actualisée de `golang-go` satisfait à la version minimale.
      La commande `go install` proprement dite pour la dépendance cible toujours
      un répertoire d’exécutables dédié et géré par OpenClaw (le répertoire
      `bin` de Homebrew lors d’une nouvelle installation, sinon
      `~/.local/bin`), plutôt que votre `GOBIN` configuré — vos propres
      variables d’environnement `GOBIN`, `GOPATH` et `GOTOOLCHAIN` sont lues,
      mais jamais remplacées.
    - **Téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2`
      | `zip`), `extract` (par défaut : automatique lorsqu’une archive est
      détectée), `stripComponents`, `targetDir` (par défaut :
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Remarques sur l’isolation">
    `requires.bins` est vérifié sur l’**hôte** lors du chargement de la skill. Si
    un agent s’exécute dans un environnement isolé, l’exécutable doit également
    exister **dans le conteneur**. Installez-le via
    `agents.defaults.sandbox.docker.setupCommand` ou une image personnalisée.
    `setupCommand` s’exécute une seule fois après la création du conteneur et
    nécessite un accès réseau sortant, un système de fichiers racine accessible
    en écriture et un utilisateur root dans l’environnement isolé.
  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Activez, désactivez et configurez les skills intégrées ou gérées sous
`skills.entries` dans `~/.openclaw/openclaw.json` :

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
  `false` désactive la skill même si elle est intégrée ou installée. La skill
  intégrée `coding-agent` doit être activée explicitement — définissez
  `skills.entries.coding-agent.enabled: true` et vérifiez que `claude`, `codex`,
  `opencode` ou une autre CLI prise en charge est installée et authentifiée.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les skills qui déclarent
  `metadata.openclaw.primaryEnv`. Accepte une chaîne en texte brut ou un objet
  SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles ne sont
  injectées que si la variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="config" type="object">
  Ensemble facultatif de champs de configuration personnalisés propres à la
  skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative réservée aux skills **intégrées**. Lorsqu’elle
  est définie, seules les skills intégrées figurant dans la liste sont
  admissibles. Les skills gérées et celles de l’espace de travail ne sont pas
  concernées.
</ParamField>

<Note>
  Par défaut, les clés de configuration correspondent au **nom de la skill**. Si
  une skill définit `metadata.openclaw.skillKey`, utilisez plutôt cette clé sous
  `skills.entries`. Placez les noms comportant des traits d’union entre
  guillemets : JSON5 autorise les clés entre guillemets.
</Note>

## Injection de l’environnement

Lorsqu’une exécution d’agent commence, OpenClaw :

<Steps>
  <Step title="Lit les métadonnées des skills">
    OpenClaw détermine la liste effective des skills de l’agent en appliquant
    les règles de filtrage, les listes d’autorisation et les remplacements de
    configuration.
  </Step>
  <Step title="Injecte les variables d’environnement et les clés API">
    `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` sont appliqués à
    `process.env` pendant toute la durée de l’exécution.
  </Step>
  <Step title="Construit le prompt système">
    Les skills admissibles sont compilées dans un bloc XML compact et injectées
    dans le prompt système.
  </Step>
  <Step title="Restaure l’environnement">
    À la fin de l’exécution, l’environnement d’origine est restauré.
  </Step>
</Steps>

<Warning>
  L’injection de variables d’environnement est limitée à l’exécution de l’agent
  sur l’**hôte**, et non à l’environnement isolé. Dans un environnement isolé,
  `env` et `apiKey` n’ont aucun effet. Consultez
  [Configuration des Skills](/fr/tools/skills-config#sandboxed-skills-and-env-vars)
  pour savoir comment transmettre des secrets aux exécutions isolées.
</Warning>

Pour le moteur intégré `claude-cli`, OpenClaw matérialise également le même
instantané de skills admissibles sous la forme d’un Plugin Claude Code
temporaire et le transmet via `--plugin-dir`. Les autres moteurs CLI utilisent
uniquement le catalogue du prompt.

## Instantanés et actualisation

OpenClaw crée un instantané des skills admissibles **au démarrage d’une
session** et réutilise cette liste pour tous les tours suivants de la session.
Les modifications apportées aux skills ou à la configuration prennent effet
lors de la prochaine nouvelle session.

Les skills sont actualisées en cours de session dans deux cas :

- Le mécanisme de surveillance des skills détecte une modification de
  `SKILL.md`.
- Un nouveau node distant admissible se connecte.

La liste actualisée est prise en compte au prochain tour de l’agent. Si la liste
d’autorisation effective de l’agent change, OpenClaw actualise l’instantané afin
que les skills visibles restent cohérentes.

<AccordionGroup>
  <Accordion title="Mécanisme de surveillance des Skills">
    Par défaut, OpenClaw surveille les dossiers de skills et actualise
    l’instantané lorsque des fichiers `SKILL.md` changent. Configurez ce
    comportement sous `skills.load` :

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Utilisez `allowSymlinkTargets` pour les structures utilisant
    intentionnellement des liens symboliques, lorsqu’un lien symbolique à la
    racine d’une skill pointe en dehors de la racine configurée, par exemple
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Activez `skills.workshop.allowSymlinkTargetWrites` uniquement lorsque Skill
    Workshop doit également appliquer des propositions via ces chemins de liens
    symboliques approuvés.

  </Accordion>
  <Accordion title="Nodes macOS distants (Gateway Linux)">
    Si le Gateway s’exécute sous Linux, mais qu’un **node macOS** est connecté
    avec l’autorisation d’utiliser `system.run`, OpenClaw peut considérer les
    skills réservées à macOS comme admissibles lorsque les exécutables requis
    sont présents sur ce node. L’agent doit exécuter ces skills via l’outil
    `exec` avec `host=node`.

    Les nodes hors ligne ne rendent **pas** visibles les skills exclusivement
    distantes. Si un node cesse de répondre aux sondes d’exécutables, OpenClaw
    efface de son cache les correspondances d’exécutables pour ce node.

  </Accordion>
</AccordionGroup>

## Incidence sur les tokens

Lorsque des skills sont admissibles, OpenClaw injecte un bloc XML compact dans
le prompt système. Le coût est déterministe et augmente linéairement pour chaque
skill :

- **Surcoût de base** (uniquement lorsqu’au moins une skill est admissible) : un
  bloc fixe de texte introductif accompagné de l’élément conteneur
  `<available_skills>`.
- **Par skill :** environ 97 caractères, auxquels s’ajoutent les longueurs de
  vos champs `name`, `description` et `location`.
- L’échappement XML transforme `& < > " '` en entités, ajoutant quelques
  caractères à chaque occurrence.
- À raison d’environ 4 caractères par token, 97 caractères représentent environ
  24 tokens par skill avant la longueur des champs.

Si le bloc rendu dépasse le budget d’invite configuré
(`skills.limits.maxSkillsPromptChars`), OpenClaw conserve d’abord autant
d’identités de Skills (nom, emplacement et version) que le format compact sans
description peut en contenir. Il utilise ensuite le budget restant pour des
descriptions raccourcies. S’il ne reste aucun budget pour les descriptions,
celles-ci sont omises. L’invite inclut une note renvoyant vers
`openclaw skills check` chaque fois qu’un formatage compact ou une troncation de
la liste est nécessaire.

Utilisez des descriptions courtes et explicites afin de réduire au minimum la
surcharge de l’invite.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Créer des Skills" href="/fr/tools/creating-skills" icon="hammer">
    Guide détaillé pour créer une Skill personnalisée.
  </Card>
  <Card title="Atelier Skills" href="/fr/tools/skill-workshop" icon="flask">
    File d’attente des propositions de Skills rédigées par des agents.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration complet de `skills.*` et listes d’autorisation des agents.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Procédure d’enregistrement et de routage des commandes slash des Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des Skills dans le registre public.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Les Plugins peuvent inclure des Skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
