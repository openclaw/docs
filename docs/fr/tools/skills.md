---
read_when:
    - Ajout ou modification de Skills
    - Modification des conditions d’activation, des listes d’autorisation ou des règles de chargement des Skills
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: Les Skills apprennent à votre agent à utiliser les outils. Découvrez comment ils sont chargés, comment fonctionne la priorité et comment configurer les conditions d’activation, les listes d’autorisation et l’injection de variables d’environnement.
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:55:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills sont des fichiers d’instructions Markdown qui indiquent à l’agent comment et quand utiliser les
outils. Chaque skill se trouve dans un répertoire contenant un fichier `SKILL.md` avec un
frontmatter YAML et un corps Markdown. OpenClaw charge les skills intégrés ainsi que les éventuelles
surcharges locales, puis les filtre au moment du chargement selon l’environnement, la configuration et
la présence des binaires.

<CardGroup cols={2}>
  <Card title="Créer des skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez et testez un skill personnalisé de A à Z.
  </Card>
  <Card title="Atelier de skills" href="/fr/tools/skill-workshop" icon="flask">
    Examinez et approuvez les propositions de skills rédigées par l’agent.
  </Card>
  <Card title="Configuration des skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration `skills.*` complet et listes d’autorisation des agents.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et installez les skills de la communauté.
  </Card>
</CardGroup>

## Ordre de chargement

OpenClaw effectue le chargement depuis les sources suivantes, **par ordre de priorité décroissante**. Lorsque le même
nom de skill apparaît à plusieurs endroits, la source ayant la priorité la plus élevée l’emporte.

| Priorité       | Source                          | Chemin                                  |
| -------------- | ------------------------------- | --------------------------------------- |
| 1 — maximale   | Skills de l’espace de travail   | `<workspace>/skills`                    |
| 2              | Skills de l’agent du projet     | `<workspace>/.agents/skills`            |
| 3              | Skills personnels de l’agent    | `~/.agents/skills`                      |
| 4              | Skills gérés / locaux           | `~/.openclaw/skills`                    |
| 5              | Skills intégrés                 | fournis avec l’installation             |
| 6 — minimale   | Répertoires supplémentaires     | `skills.load.extraDirs` + skills de Plugin |

Les racines de skills prennent en charge les structures groupées. OpenClaw découvre un skill dès qu’un fichier
`SKILL.md` apparaît dans une racine configurée (jusqu’à 6 niveaux de profondeur) :

```text
<workspace>/skills/research/SKILL.md          ✓ trouvé sous le nom « research »
<workspace>/skills/personal/research/SKILL.md ✓ également trouvé sous le nom « research »
```

Le chemin du dossier sert uniquement à l’organisation. Le nom et la commande avec barre oblique
du skill proviennent du champ de frontmatter `name` (ou du nom du répertoire lorsque `name` est
absent). Les listes d’autorisation des agents (ci-dessous) utilisent également ce `name`.

<Note>
  Le répertoire natif `$CODEX_HOME/skills` de Codex CLI n’est **pas** une racine de
  skills OpenClaw. Utilisez `openclaw migrate plan codex` pour inventorier ces skills, puis
  `openclaw migrate codex` pour les copier dans votre espace de travail OpenClaw.
</Note>

## Skills hébergés sur un Node

Un Node sans interface graphique connecté peut publier les skills installés dans son répertoire actif de
skills OpenClaw (`~/.openclaw/skills` par défaut ; les substitutions de l’environnement de profil
s’appliquent). Ils apparaissent dans la liste normale des skills de l’agent tant que le Node est connecté
et disparaissent lorsqu’il se déconnecte. En cas de conflit, un skill local ou du Gateway conserve son nom ;
le skill du Node reçoit un nom déterministe préfixé par le Node.
La v1 des skills hébergés sur un Node exige que le nom du répertoire corresponde au champ de frontmatter
`name` du skill.

L’entrée du skill inclut le localisateur du Node. Ses fichiers, références relatives et
binaires résident sur le Node ; chargez-le et exécutez-le donc avec
`exec host=node node=<node-id>`. Redémarrez l’hôte du Node après avoir modifié ses fichiers de
skill. Consultez [Nodes](/fr/nodes#node-hosted-skills) pour l’appairage et les mécanismes de désactivation.

## Skills propres à un agent ou partagés

Dans les configurations multi-agents, chaque agent possède son propre espace de travail. Utilisez le chemin qui
correspond à la visibilité souhaitée :

| Portée                  | Chemin                       | Visible par                           |
| ----------------------- | ---------------------------- | ------------------------------------- |
| Propre à l’agent        | `<workspace>/skills`         | Cet agent uniquement                  |
| Agent du projet         | `<workspace>/.agents/skills` | L’agent de cet espace de travail uniquement |
| Agent personnel         | `~/.agents/skills`           | Tous les agents sur cette machine     |
| Partagé et géré         | `~/.openclaw/skills`         | Tous les agents sur cette machine     |
| Répertoires supplémentaires | `skills.load.extraDirs`  | Tous les agents sur cette machine     |

## Listes d’autorisation des agents

L’**emplacement** du skill (priorité) et sa **visibilité** (quel agent peut
l’utiliser) sont des contrôles distincts. Utilisez des listes d’autorisation pour limiter les skills visibles par un agent,
quel que soit leur emplacement de chargement.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // référence partagée
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace entièrement les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Règles des listes d’autorisation">
    - Omettez `agents.defaults.skills` pour que tous les skills restent autorisés par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’exposer aucun skill à cet agent.
    - Une liste `agents.list[].skills` non vide constitue l’ensemble **définitif** — elle ne se
      combine pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction des prompts, à la découverte des commandes
      avec barre oblique, à la synchronisation du bac à sable et aux instantanés des skills.
    - Il ne s’agit pas d’une frontière d’autorisation du shell hôte. Si le même agent peut
      utiliser `exec`, limitez séparément ce shell avec un bac à sable, l’isolation
      par utilisateur du système d’exploitation, des listes d’interdiction ou d’autorisation pour l’exécution et des identifiants propres à chaque ressource.
  </Accordion>
</AccordionGroup>

## Plugins et skills

Les Plugins peuvent fournir leurs propres skills en répertoriant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les skills d’un Plugin sont chargés
lorsque le Plugin est activé — par exemple, le Plugin de navigateur fournit un skill
`browser-automation` pour le contrôle du navigateur en plusieurs étapes.

Les répertoires de skills des Plugins sont fusionnés au même niveau de faible priorité que
`skills.load.extraDirs` ; un skill intégré, géré, d’agent ou d’espace de travail portant le même nom
les remplace donc. Contrôlez l’éligibilité propre d’un skill de Plugin via
`metadata.openclaw.requires` dans son frontmatter, comme pour tout autre skill.

Consultez [Plugins](/fr/tools/plugin) et [Outils](/fr/tools) pour découvrir le système complet de Plugins.

## Atelier de skills

[L’atelier de skills](/fr/tools/skill-workshop) est une file de propositions entre l’agent
et vos fichiers de skills actifs. Lorsque l’agent repère un travail réutilisable, il rédige une
proposition au lieu d’écrire directement dans `SKILL.md`. Vous l’examinez et l’approuvez
avant toute modification.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Consultez [L’atelier de skills](/fr/tools/skill-workshop) pour connaître l’intégralité du cycle de vie, la référence de la CLI
et la configuration.

## Installation depuis ClawHub

[ClawHub](https://clawhub.ai) est le registre public de skills. Utilisez les commandes
`openclaw skills` pour l’installation et la mise à jour, ou la CLI `clawhub` pour la
publication et la synchronisation.

| Action                                       | Commande                                               |
| -------------------------------------------- | ------------------------------------------------------ |
| Installer un skill dans l’espace de travail  | `openclaw skills install @owner/<slug>`                |
| Installer depuis un dépôt Git                | `openclaw skills install git:owner/repo@ref`           |
| Installer un répertoire local de skill       | `openclaw skills install ./path/to/skill --as my-tool` |
| Installer pour tous les agents locaux        | `openclaw skills install @owner/<slug> --global`       |
| Mettre à jour tous les skills de l’espace de travail | `openclaw skills update --all`                  |
| Mettre à jour un skill partagé et géré       | `openclaw skills update @owner/<slug> --global`        |
| Mettre à jour tous les skills partagés et gérés | `openclaw skills update --all --global`             |
| Vérifier le périmètre de confiance d’un skill | `openclaw skills verify @owner/<slug>`                |
| Afficher la fiche de skill générée           | `openclaw skills verify @owner/<slug> --card`          |
| Publier / synchroniser via la CLI ClawHub    | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Détails de l’installation">
    Par défaut, `openclaw skills install` installe dans le répertoire `skills/` de
    l’espace de travail actif. Ajoutez `--global` pour installer dans le répertoire partagé
    `~/.openclaw/skills`, visible par tous les agents locaux sauf si leurs listes
    d’autorisation en limitent l’accès.

    Les installations Git et locales attendent un fichier `SKILL.md` à la racine de la source. Le slug provient
    du champ de frontmatter `name` de `SKILL.md` lorsqu’il est valide, puis utilise à défaut le
    nom du répertoire ou du dépôt. Utilisez `--as <slug>` pour le remplacer.
    `openclaw skills update` suit uniquement les installations ClawHub — réinstallez les sources Git ou
    locales pour les actualiser.

  </Accordion>
  <Accordion title="Vérification et analyse de sécurité">
    `openclaw skills verify @owner/<slug>` demande à ClawHub l’enveloppe de confiance
    `clawhub.skill.verify.v1` du skill. Les skills ClawHub installés sont vérifiés
    par rapport à la version et au registre enregistrés dans `.clawhub/origin.json`.
    Les slugs seuls restent acceptés pour les skills déjà installés ou non ambigus, mais
    les références qualifiées par le propriétaire évitent toute ambiguïté concernant l’éditeur.

    Les pages de skills ClawHub affichent l’état de la dernière analyse de sécurité avant l’installation,
    avec des pages détaillées pour VirusTotal, ClawScan et l’analyse statique. La
    commande renvoie un code différent de zéro lorsque ClawHub indique que la vérification a échoué. Les éditeurs
    peuvent corriger les faux positifs depuis le tableau de bord ClawHub ou avec
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installations depuis une archive privée">
    Les clients du Gateway qui nécessitent une distribution hors ClawHub peuvent préparer une archive ZIP de skill
    avec `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`,
    puis l’installer avec `skills.install({ source: "upload", ... })`. Ce chemin est
    désactivé par défaut et nécessite `skills.install.allowUploadedArchives: true` dans
    `openclaw.json`. Les installations ClawHub normales n’ont jamais besoin de ce paramètre.
  </Accordion>
</AccordionGroup>

## Sécurité

<Warning>
  Considérez les skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
  Privilégiez les exécutions dans un bac à sable pour les entrées non fiables et les outils à risque. Consultez
  [Mise en bac à sable](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

<AccordionGroup>
  <Accordion title="Confinement des chemins">
    La découverte des skills de l’espace de travail, de l’agent du projet et des répertoires supplémentaires n’accepte que les racines de
    skills dont le chemin réel résolu reste dans la racine configurée, sauf si
    `skills.load.allowSymlinkTargets` approuve explicitement une racine cible.
    L’atelier de skills écrit via ces cibles approuvées uniquement lorsque
    `skills.workshop.allowSymlinkTargetWrites` est activé.
    Les répertoires gérés `~/.openclaw/skills` et personnels `~/.agents/skills` peuvent contenir
    des dossiers de skills liés symboliquement, mais le chemin réel de chaque fichier `SKILL.md` doit toujours rester
    dans son répertoire de skill résolu.
  </Accordion>
  <Accordion title="Politique d’installation de l’opérateur">
    Configurez `security.installPolicy` pour exécuter une commande de politique locale approuvée
    avant de poursuivre l’installation des skills. La politique reçoit les métadonnées et le chemin
    de la source préparée, s’applique aux chemins ClawHub, d’envoi, Git, locaux, de mise à jour et
    d’installation des dépendances, et refuse par défaut lorsque la commande ne peut pas renvoyer
    une décision valide.
  </Accordion>
  <Accordion title="Portée de l’injection des secrets">
    `skills.entries.*.env` et `skills.entries.*.apiKey` injectent les secrets dans le
    processus **hôte** pour ce tour de l’agent uniquement — pas dans le bac à sable. Ne placez pas les
    secrets dans les prompts ni dans les journaux.
  </Accordion>
</AccordionGroup>

Pour le modèle de menace général et les listes de contrôle de sécurité, consultez
[Sécurité](/fr/gateway/security).

## Format de SKILL.md

Chaque skill requiert au minimum un `name` et une `description` dans le frontmatter :

```markdown
---
name: image-lab
description: Générer ou modifier des images via un flux de travail d’images reposant sur un fournisseur
---

Lorsque l’utilisateur demande de générer une image, utilisez l’outil `image_generate`...
```

<Note>
  OpenClaw suit la spécification [AgentSkills](https://agentskills.io). Le frontmatter
  est d’abord analysé comme du YAML ; en cas d’échec, OpenClaw utilise un analyseur
  limité à une seule ligne. Les blocs `metadata` imbriqués (y compris les mappages
  YAML multilignes) sont aplatis en une chaîne JSON, puis réanalysés comme du JSON5 ;
  la forme de bloc présentée sous [Filtrage](#gating) fonctionne donc. Utilisez
  `{baseDir}` dans le corps pour référencer le chemin du dossier de la compétence.
</Note>

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée sous « Website » dans l’interface Skills de macOS. Également prise
  en charge via `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque cette valeur est `true`, la compétence est exposée comme une commande
  slash pouvant être invoquée par l’utilisateur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque cette valeur est `true`, OpenClaw exclut les instructions de la compétence
  du prompt normal de l’agent. La compétence reste disponible comme commande slash
  lorsque `user-invocable` vaut également `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Lorsque cette valeur est définie sur `tool`, la commande slash contourne le modèle
  et est transmise directement à un outil enregistré.
</ParamField>

<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la transmission à un outil, transmet la chaîne d’arguments brute à l’outil
  sans analyse par le cœur. L’outil reçoit
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Filtrage

OpenClaw filtre les compétences au chargement à l’aide de `metadata.openclaw`
(objet JSON5 intégré au frontmatter ; consultez la note d’analyse ci-dessus).
Une compétence sans bloc `metadata.openclaw` est toujours admissible, sauf si
elle est explicitement désactivée.

```markdown
---
name: image-lab
description: Générer ou modifier des images via un flux de travail d’image adossé à un fournisseur
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
  Lorsque cette valeur est `true`, inclut toujours la compétence et ignore tous
  les autres filtres.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji facultatif affiché dans l’interface Skills de macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL facultative affichée sous « Website » dans l’interface Skills de macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Filtre de plateforme. Lorsqu’il est défini, la compétence n’est admissible que
  sur un système d’exploitation répertorié.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Chaque binaire doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Au moins un binaire doit exister dans `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Chaque variable d’environnement doit exister dans le processus ou être fournie
  via la configuration.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Chaque chemin `openclaw.json` doit avoir une valeur vraie.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nom de la variable d’environnement associée à `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Spécifications d’installation facultatives utilisées par l’interface Skills
  de macOS (brew / node / go / uv / téléchargement).
</ParamField>

<Note>
  Les anciens blocs `metadata.clawdbot` sont toujours acceptés lorsque
  `metadata.openclaw` est absent, afin que les compétences plus anciennes déjà
  installées conservent leurs filtres de dépendances et leurs indications
  d’installation. Les nouvelles compétences doivent utiliser
  `metadata.openclaw`.
</Note>

### Spécifications d’installation

Les spécifications d’installation indiquent à l’interface Skills de macOS
comment installer une dépendance :

```markdown
---
name: gemini
description: Utiliser la CLI Gemini pour l’assistance au codage et les recherches Google.
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
              "label": "Installer la CLI Gemini (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Règles de sélection du programme d’installation">
    - Lorsque plusieurs programmes d’installation sont répertoriés, le Gateway
      choisit une option préférée (brew lorsqu’il est disponible, sinon node).
    - Si tous les programmes d’installation sont de type `download`, OpenClaw
      répertorie chaque entrée afin que vous puissiez voir tous les artefacts
      disponibles.
    - Les spécifications peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour
      filtrer selon la plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans
      `openclaw.json` (valeur par défaut : npm ; options : npm / pnpm / yarn / bun).
      Cela affecte uniquement l’installation des compétences ; l’environnement
      d’exécution du Gateway doit toujours être Node.
    - Ordre de préférence du programme d’installation du Gateway : Homebrew → uv
      → gestionnaire node configuré → go → téléchargement.
  </Accordion>
  <Accordion title="Détails propres à chaque programme d’installation">
    - **Homebrew :** OpenClaw n’installe pas automatiquement Homebrew et ne
      traduit pas les formules brew en commandes de gestion des paquets système.
      Dans les conteneurs Linux sans `brew`, les programmes d’installation
      reposant uniquement sur brew sont masqués ; utilisez une image personnalisée
      ou installez manuellement la dépendance.
    - **Go :** OpenClaw nécessite Go 1.21 ou une version ultérieure pour
      l’installation automatique des compétences. Si `go` est absent et que
      Homebrew est disponible, OpenClaw installe d’abord Go via Homebrew ; sous
      Linux sans Homebrew, il peut utiliser à la place `apt-get` en tant que
      superutilisateur ou via `sudo` sans mot de passe lorsque le candidat
      `golang-go` actualisé satisfait à la version minimale. La commande
      `go install` effective pour la dépendance cible toujours un répertoire de
      binaires dédié géré par OpenClaw (le répertoire `bin` de Homebrew lors
      d’une nouvelle installation, sinon `~/.local/bin`) plutôt que votre
      `GOBIN` configuré — vos propres variables d’environnement `GOBIN`,
      `GOPATH` et `GOTOOLCHAIN` sont lues, mais jamais remplacées.
    - **Téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (valeur par défaut : automatique lorsqu’une archive est détectée),
      `stripComponents`, `targetDir` (valeur par défaut :
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Remarques sur l’isolation">
    `requires.bins` est vérifié sur l’**hôte** au chargement de la compétence.
    Si un agent s’exécute dans un environnement isolé, le binaire doit également
    exister **dans le conteneur**. Installez-le via
    `agents.defaults.sandbox.docker.setupCommand` ou une image personnalisée.
    `setupCommand` s’exécute une seule fois après la création du conteneur et
    nécessite un accès réseau sortant, un système de fichiers racine accessible
    en écriture et un utilisateur root dans l’environnement isolé.
  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Activez, désactivez et configurez les compétences intégrées ou gérées sous
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
  `false` désactive la compétence, même si elle est intégrée ou installée. La
  compétence intégrée `coding-agent` est facultative — définissez
  `skills.entries.coding-agent.enabled: true` et vérifiez que `claude`, `codex`,
  `opencode` ou une autre CLI prise en charge est installée et authentifiée.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Champ pratique pour les compétences qui déclarent
  `metadata.openclaw.primaryEnv`. Prend en charge une chaîne en texte brut ou
  un objet SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variables d’environnement injectées pour l’exécution de l’agent. Elles ne sont
  injectées que si la variable n’est pas déjà définie dans le processus.
</ParamField>

<ParamField path="config" type="object">
  Ensemble facultatif de champs de configuration personnalisés propres à la
  compétence.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative réservée aux compétences **intégrées**.
  Lorsqu’elle est définie, seules les compétences intégrées figurant dans la
  liste sont admissibles. Les compétences gérées et celles de l’espace de
  travail ne sont pas affectées.
</ParamField>

<Note>
  Par défaut, les clés de configuration correspondent au **nom de la compétence**.
  Si une compétence définit `metadata.openclaw.skillKey`, utilisez plutôt cette
  clé sous `skills.entries`. Mettez les noms contenant des traits d’union entre
  guillemets : JSON5 autorise les clés entre guillemets.
</Note>

## Injection de l’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

<Steps>
  <Step title="Lit les métadonnées des compétences">
    OpenClaw détermine la liste effective des compétences pour l’agent en
    appliquant les règles de filtrage, les listes d’autorisation et les
    remplacements de configuration.
  </Step>
  <Step title="Injecte les variables d’environnement et les clés d’API">
    `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` sont appliqués à
    `process.env` pendant toute la durée de l’exécution.
  </Step>
  <Step title="Construit le prompt système">
    Les compétences admissibles sont compilées dans un bloc XML compact et
    injectées dans le prompt système.
  </Step>
  <Step title="Restaure l’environnement">
    Une fois l’exécution terminée, l’environnement d’origine est restauré.
  </Step>
</Steps>

<Warning>
  L’injection de l’environnement est limitée à l’exécution de l’agent sur
  l’**hôte**, et non à l’environnement isolé. Dans un environnement isolé,
  `env` et `apiKey` n’ont aucun effet. Consultez
  [Configuration des compétences](/fr/tools/skills-config#sandboxed-skills-and-env-vars)
  pour savoir comment transmettre des secrets aux exécutions isolées.
</Warning>

Pour le backend intégré `claude-cli`, OpenClaw matérialise également le même
instantané de compétences admissibles sous la forme d’un plugin Claude Code
temporaire et le transmet via `--plugin-dir`. Les autres backends CLI utilisent
uniquement le catalogue du prompt.

## Instantanés et actualisation

OpenClaw crée un instantané des compétences admissibles **au démarrage d’une
session** et réutilise cette liste pour tous les tours suivants de la session.
Les modifications apportées aux compétences ou à la configuration prennent
effet lors de la prochaine nouvelle session.

Les compétences sont actualisées en cours de session dans deux cas :

- L’observateur des compétences détecte une modification de `SKILL.md`.
- Un nouveau nœud distant admissible se connecte.

La liste actualisée est utilisée lors du tour d’agent suivant. Si la liste
d’autorisation effective de l’agent change, OpenClaw actualise l’instantané afin
que les compétences visibles restent alignées.

<AccordionGroup>
  <Accordion title="Observateur des compétences">
    Par défaut, OpenClaw surveille les dossiers de compétences et actualise
    l’instantané lorsque des fichiers `SKILL.md` changent. Configurez ce
    comportement sous `skills.load` :

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // valeur par défaut
          watchDebounceMs: 250, // valeur par défaut
        },
      },
    }
    ```

    Utilisez `allowSymlinkTargets` pour les structures utilisant volontairement
    des liens symboliques, lorsqu’un lien symbolique de racine de compétence
    pointe hors de la racine configurée, par exemple
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Activez `skills.workshop.allowSymlinkTargetWrites` uniquement lorsque Skill
    Workshop doit également appliquer des propositions par l’intermédiaire de
    ces chemins de liens symboliques approuvés.

  </Accordion>
  <Accordion title="Nœuds macOS distants (Gateway Linux)">
    Si le Gateway s’exécute sous Linux, mais qu’un **nœud macOS** est connecté
    avec `system.run` autorisé, OpenClaw peut considérer les compétences
    réservées à macOS comme admissibles lorsque les binaires requis sont
    présents sur ce nœud. L’agent doit exécuter ces compétences via l’outil
    `exec` avec `host=node`.

    Les nœuds hors ligne ne rendent **pas** visibles les compétences disponibles
    uniquement à distance. Si un nœud cesse de répondre aux sondes de binaires,
    OpenClaw efface les correspondances de binaires mises en cache pour ce nœud.

  </Accordion>
</AccordionGroup>

## Impact sur les tokens

Lorsque des compétences sont admissibles, OpenClaw injecte un bloc XML compact
dans le prompt système. Le coût est déterministe et augmente linéairement pour
chaque compétence :

- **Surcharge de base** (uniquement lorsqu’au moins 1 compétence est admissible) :
  un bloc fixe de texte introductif, ainsi que l’enveloppe `<available_skills>`.
- **Par compétence :** environ 97 caractères + la longueur de vos champs `name`,
  `description` et `location`.
- L’échappement XML développe `& < > " '` en entités, ce qui ajoute quelques
  caractères par occurrence.
- À environ 4 caractères/token, 97 caractères ≈ 24 tokens par compétence avant
  la longueur des champs.

Si le bloc rendu devait dépasser le budget d’invite configuré
(`skills.limits.maxSkillsPromptChars`), OpenClaw conserve d’abord autant
d’identités de Skills (nom, emplacement et version) que le format compact sans
description peut en contenir. Il utilise ensuite le budget restant pour des
descriptions abrégées. S’il ne reste aucun budget pour les descriptions, celles-ci
sont omises. L’invite inclut une note renvoyant vers `openclaw skills check`
chaque fois que le formatage compact ou la troncature de la liste est nécessaire.

Utilisez des descriptions courtes et explicites afin de réduire la surcharge de l’invite.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Créer des Skills" href="/fr/tools/creating-skills" icon="hammer">
    Guide détaillé pour créer un Skill personnalisé.
  </Card>
  <Card title="Atelier des Skills" href="/fr/tools/skill-workshop" icon="flask">
    File d’attente des propositions de Skills rédigées par les agents.
  </Card>
  <Card title="Configuration des Skills" href="/fr/tools/skills-config" icon="gear">
    Schéma de configuration complet de `skills.*` et listes d’autorisation des agents.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="terminal">
    Comment les commandes slash des Skills sont enregistrées et acheminées.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Parcourez et publiez des Skills dans le registre public.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Les Plugins peuvent fournir des Skills avec les outils qu’ils documentent.
  </Card>
</CardGroup>
