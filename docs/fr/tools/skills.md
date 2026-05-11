---
read_when:
    - Ajout ou modification de Skills
    - Modification du contrôle d’accès des Skills, des listes d’autorisation ou des règles de chargement
    - Comprendre l’ordre de priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérés ou d’espace de travail, règles de contrôle, listes d’autorisation des agents et câblage de la configuration'
title: Skills
x-i18n:
    generated_at: "2026-05-11T21:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw utilise des dossiers de skill **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser des outils. Chaque skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les skills intégrées ainsi que les remplacements locaux facultatifs, et les filtre au moment du chargement selon l’environnement, la config et la présence de binaires.

## Emplacements et ordre de priorité

OpenClaw charge les skills depuis ces sources, **priorité la plus élevée d’abord** :

| #   | Source                         | Chemin                           |
| --- | ------------------------------ | -------------------------------- |
| 1   | Skills d’espace de travail     | `<workspace>/skills`             |
| 2   | Skills d’agent de projet       | `<workspace>/.agents/skills`     |
| 3   | Skills d’agent personnels      | `~/.agents/skills`               |
| 4   | Skills gérés/locaux            | `~/.openclaw/skills`             |
| 5   | Skills intégrés                | fournis avec l’installation      |
| 6   | Dossiers de skills additionnels | `skills.load.extraDirs` (config) |

Si un nom de skill entre en conflit, la source la plus prioritaire l’emporte.

Le répertoire natif `$CODEX_HOME/skills` de Codex CLI ne fait pas partie de ces
racines de skills OpenClaw. En mode harnais Codex, les lancements locaux du
serveur d’application utilisent des répertoires Codex isolés par agent ; les
skills personnelles de Codex CLI ne sont donc pas chargées implicitement.
Utilisez `openclaw migrate codex --dry-run` pour les inventorier et
`openclaw migrate codex` pour choisir les répertoires de skills avec une invite
interactive à cases à cocher avant de les copier dans l’espace de travail de
l’agent OpenClaw actuel. Pour les exécutions non interactives, répétez
`--skill <name>` pour les skills exactes à copier.

## Skills par agent et skills partagées

Dans les configurations **multi-agent**, chaque agent dispose de son propre espace de travail :

| Portée               | Chemin                                      | Visible par                         |
| -------------------- | ------------------------------------------- | ----------------------------------- |
| Par agent            | `<workspace>/skills`                        | Cet agent uniquement                |
| Agent de projet      | `<workspace>/.agents/skills`                | L’agent de cet espace uniquement    |
| Agent personnel      | `~/.agents/skills`                          | Tous les agents de cette machine    |
| Géré/local partagé   | `~/.openclaw/skills`                        | Tous les agents de cette machine    |
| Dossiers supplémentaires partagés | `skills.load.extraDirs` (priorité la plus basse) | Tous les agents de cette machine    |

Même nom à plusieurs endroits → la source la plus prioritaire l’emporte. L’espace de travail prime sur
l’agent de projet, qui prime sur l’agent personnel, qui prime sur le géré/local,
qui prime sur l’intégré, qui prime sur les dossiers supplémentaires.

## Listes d’autorisation de skills d’agent

L’**emplacement** d’une skill et sa **visibilité** sont des contrôles distincts.
L’emplacement/la priorité détermine quelle copie d’une skill portant le même nom l’emporte ; les listes
d’autorisation d’agent déterminent quelles skills un agent peut réellement utiliser.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Règles de liste d’autorisation">
    - Omettez `agents.defaults.skills` pour autoriser toutes les skills par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucune skill.
    - Une liste `agents.list[].skills` non vide constitue l’ensemble **final** pour cet
      agent - elle ne fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction du prompt, à la
      découverte des commandes slash de skills, à la synchronisation du sandbox et aux instantanés de skills.
  </Accordion>
</AccordionGroup>

## Plugins et skills

Les Plugins peuvent fournir leurs propres skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les skills de Plugin
sont chargées lorsque le Plugin est activé. C’est l’endroit approprié pour les guides
opérationnels propres à un outil qui sont trop longs pour la description de l’outil, mais doivent être
disponibles dès que le Plugin est installé - par exemple, le Plugin de navigateur
fournit une skill `browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de skills de Plugin sont fusionnés dans le même chemin de faible priorité que
`skills.load.extraDirs` ; une skill intégrée, gérée, d’agent ou
d’espace de travail portant le même nom les remplace donc. Vous pouvez les conditionner via
`metadata.openclaw.requires.config` dans l’entrée de config du Plugin.

Consultez [Plugins](/fr/tools/plugin) pour la découverte/config et [Outils](/fr/tools) pour
la surface d’outils que ces skills enseignent.

## Skill Workshop

Le Plugin **Skill Workshop**, facultatif et expérimental, peut créer ou mettre à jour
des skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il
est désactivé par défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu
généré, prend en charge l’approbation en attente ou les écritures sûres automatiques, met en quarantaine
les propositions dangereuses et actualise l’instantané des skills après les écritures
réussies afin que les nouvelles skills deviennent disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections comme _« la prochaine fois, vérifier l’attribution des GIF »_ ou
des workflows éprouvés comme des listes de contrôle QA média. Commencez avec une approbation
en attente ; n’utilisez les écritures automatiques que dans des espaces de travail de confiance après avoir examiné
ses propositions. Guide complet : [Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public de skills pour OpenClaw.
Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou la
CLI `clawhub` séparée pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/clawhub).

| Action                                      | Commande                               |
| ------------------------------------------- | -------------------------------------- |
| Installer une skill dans l’espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour toutes les skills installées   | `openclaw skills update --all`         |
| Synchroniser (analyse + publication des mises à jour) | `clawhub sync --all`                   |

La commande native `openclaw skills install` installe dans le répertoire actif
`skills/` de l’espace de travail. La CLI `clawhub` séparée installe aussi dans
`./skills` sous votre répertoire de travail actuel (ou revient à l’espace de travail
OpenClaw configuré). OpenClaw le détecte comme
`<workspace>/skills` à la session suivante.
Les racines de skills configurées prennent également en charge un niveau de regroupement, comme
`skills/<group>/<skill>/SKILL.md`, afin que des skills tierces associées puissent être
conservées sous un dossier partagé sans analyse récursive large.

Les clients Gateway qui ont besoin d’une livraison privée hors ClawHub peuvent préparer une archive zip de skill
avec `skills.upload.begin`, `skills.upload.chunk` et
`skills.upload.commit`, puis installer l’envoi validé avec
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. Il s’agit
d’un chemin d’envoi administrateur explicite pour des clients de confiance, et non du flux normal
`openclaw skills install <slug>` ou d’installation ClawHub. Il est désactivé par défaut
et fonctionne uniquement lorsque `skills.install.allowUploadedArchives: true` est défini dans
`openclaw.json`. Le mode d’envoi installe toujours dans le répertoire par défaut de l’espace de travail d’agent
`skills/<slug>` ; le nom de dossier interne de l’archive est ignoré pour la
cible d’installation finale.

Les pages de skills ClawHub exposent le dernier état de l’analyse de sécurité avant installation,
avec des pages de détail d’analyseur pour VirusTotal, ClawScan et l’analyse statique.
`openclaw skills install <slug>` reste uniquement le chemin d’installation ; les éditeurs
corrigent les faux positifs via le tableau de bord ClawHub ou
`clawhub skill rescan <slug>`.

## Sécurité

<Warning>
Traitez les skills tierces comme du **code non fiable**. Lisez-les avant de les activer.
Privilégiez les exécutions sandboxées pour les entrées non fiables et les outils risqués. Voir
[Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte de skills dans l’espace de travail et les dossiers supplémentaires n’accepte que les racines de skills et les fichiers `SKILL.md` dont le realpath résolu reste dans la racine configurée.
- Les installations d’archives privées via Gateway sont désactivées par défaut. Lorsqu’elles sont explicitement activées,
  elles exigent un envoi zip validé contenant `SKILL.md` et réutilisent les mêmes
  protections d’extraction d’archive, de traversée de chemin, de lien symbolique, de forçage et de rollback que
  les installations de skills ClawHub. Elles sont contrôlées par
  `skills.install.allowUploadedArchives` ; les installations ClawHub normales n’exigent pas
  ce paramètre.
- Les installations de dépendances de skills adossées au Gateway (`skills.install`, onboarding et l’interface de paramètres Skills) exécutent l’analyseur intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut sauf si l’appelant définit explicitement le contournement dangereux ; les résultats suspects continuent seulement à avertir.
- `openclaw skills install <slug>` est différent - il télécharge un dossier de skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte** pour ce tour d’agent (pas dans le sandbox). Gardez les secrets hors des prompts et des journaux.

Pour un modèle de menace et des listes de contrôle plus larges, voir [Sécurité](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la disposition/l’intention. Le parseur utilisé
par l’agent intégré prend uniquement en charge les clés de frontmatter **sur une seule ligne** ;
`metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans
les instructions pour référencer le chemin du dossier de la skill.

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Site Web » dans l’interface Skills macOS. Également pris en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, la skill est exposée comme commande slash utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, OpenClaw exclut les instructions de la skill du prompt normal de
  l’agent. La skill reste installée et peut toujours être exécutée explicitement comme
  commande slash lorsque `user-invocable` vaut aussi `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsqu’il est défini sur `tool`, la commande slash contourne le modèle et est distribuée directement à un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l’outil à appeler lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la distribution vers un outil, transmet la chaîne brute des arguments à l’outil (aucune analyse par le cœur). L’outil est appelé avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Conditions (filtres au chargement)

OpenClaw filtre les skills au moment du chargement à l’aide de `metadata` (JSON sur une seule ligne) :

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

Champs sous `metadata.openclaw` :

<ParamField path="always" type="boolean">
  Quand la valeur est `true`, inclut toujours la Skill (ignore les autres garde-fous).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facultatif utilisé par l’interface utilisateur macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL facultative affichée sous le libellé « Site web » dans l’interface utilisateur macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste facultative de plateformes. Si elle est définie, la Skill n’est éligible que sur ces systèmes d’exploitation.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Chacun doit exister dans `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Au moins un doit exister dans `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable d’environnement doit exister ou être fournie dans la configuration.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste des chemins `openclaw.json` qui doivent avoir une valeur véridique.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spécifications d’installation facultatives utilisées par l’interface utilisateur macOS Skills (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n’est présent, la Skill est toujours éligible (sauf si elle est
désactivée dans la configuration ou bloquée par `skills.allowBundled` pour les Skills groupées).

<Note>
Les anciens blocs `metadata.clawdbot` sont toujours acceptés lorsque
`metadata.openclaw` est absent, afin que les anciennes Skills installées conservent leurs
garde-fous de dépendances et leurs indications d’installation. Les Skills nouvelles ou mises à jour doivent utiliser
`metadata.openclaw`.
</Note>

### Notes sur le bac à sable

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement de la Skill.
- Si un agent est exécuté dans un bac à sable, le binaire doit aussi exister **dans le conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s’exécute une fois après la création du conteneur. Les installations de paquets nécessitent aussi une sortie réseau, un système de fichiers racine accessible en écriture et un utilisateur root dans le bac à sable.
- Exemple : la Skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize` dans le conteneur de bac à sable pour s’y exécuter.

### Spécifications d’installation

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
    - Si plusieurs programmes d’installation sont listés, le Gateway choisit une seule option préférée (brew lorsqu’il est disponible, sinon node).
    - Si tous les programmes d’installation sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (valeur par défaut : npm ; options : npm/pnpm/yarn/bun). Cela affecte uniquement les installations de Skills ; le runtime Gateway doit toujours être Node - Bun n’est pas recommandé pour WhatsApp/Telegram.
    - La sélection du programme d’installation adossée au Gateway suit les préférences : lorsque les spécifications d’installation mélangent les types, OpenClaw préfère Homebrew lorsque `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire node configuré, puis d’autres solutions de repli comme `go` ou `download`.
    - Si chaque spécification d’installation est `download`, OpenClaw expose toutes les options de téléchargement au lieu de les réduire à un seul programme d’installation préféré.

  </Accordion>
  <Accordion title="Per-installer details">
    - **Installations Go :** si `go` est manquant et que `brew` est disponible, le Gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le répertoire `bin` de Homebrew lorsque c’est possible.
    - **Installations par téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (valeur par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (valeur par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Les Skills groupées et gérées peuvent être activées ou désactivées et recevoir des valeurs d’environnement
sous `skills.entries` dans `~/.openclaw/openclaw.json` :

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` désactive la Skill même si elle est groupée ou installée.
  La Skill groupée `coding-agent` est optionnelle : définissez
  `skills.entries.coding-agent.enabled: true` avant de l’exposer aux agents,
  puis assurez-vous que l’un de `claude`, `codex`, `opencode` ou `pi` est installé et
  authentifié pour sa propre CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Raccourci pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`. Prend en charge le texte en clair ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injecté uniquement si la variable n’est pas déjà définie dans le processus.
</ParamField>
<ParamField path="config" type="object">
  Conteneur facultatif pour les champs personnalisés propres à la Skill. Les clés personnalisées doivent s’y trouver.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative pour les Skills **groupées** uniquement. Si elle est définie, seules les Skills groupées de la liste sont éligibles (les Skills gérées/de l’espace de travail ne sont pas affectées).
</ParamField>

Si le nom de la Skill contient des traits d’union, mettez la clé entre guillemets (JSON5 autorise les
clés entre guillemets). Les clés de configuration correspondent par défaut au **nom de la Skill** - si une Skill
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d’images stock dans OpenClaw, utilisez l’outil central
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu
d’une Skill groupée. Les exemples de Skills ici concernent des workflows personnalisés ou tiers.
Pour l’analyse d’image native, utilisez l’outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image propre à un fournisseur, ajoutez aussi la clé
d’authentification/API de ce fournisseur.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées de Skill.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit le prompt système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine après la fin de l’exécution.

L’injection d’environnement est **limitée à l’exécution de l’agent**, et non à un environnement
shell global.

Pour le backend groupé `claude-cli`, OpenClaw matérialise aussi le même
instantané éligible sous forme de Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur de Skills natif tandis
qu’OpenClaw conserve la maîtrise de la précédence, des listes d’autorisation par agent, des garde-fous et de
l’injection des clés d’environnement/API `skills.entries.*`. Les autres backends CLI utilisent uniquement le
catalogue de prompts.

## Instantanés et actualisation

OpenClaw prend un instantané des Skills éligibles **au démarrage d’une session** et
réutilise cette liste pour les tours suivants de la même session. Les changements apportés aux
Skills ou à la configuration prennent effet à la nouvelle session suivante.

Les Skills peuvent être actualisées en cours de session dans deux cas :

- Le watcher de Skills est activé.
- Un nouveau nœud distant éligible apparaît.

Considérez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au
tour d’agent suivant. Si la liste d’autorisation effective des Skills de l’agent change pour cette
session, OpenClaw actualise l’instantané afin que les Skills visibles restent alignées
avec l’agent actuel.

### Watcher de Skills

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané des Skills
lorsque les fichiers `SKILL.md` changent. Configurez sous `skills.load` :

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

Utilisez `allowSymlinkTargets` pour les dispositions intentionnelles de dépôts voisins où une racine
de Skill intégrée contient un lien symbolique, par exemple
`~/.agents/skills/manager -> ~/Projects/manager/skills`. La liste des cibles est
comparée après résolution de realpath et doit rester restreinte.

### Nœuds macOS distants (Gateway Linux)

Si le Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté avec
`system.run` autorisé (la sécurité des approbations Exec n’étant pas définie sur `deny`),
OpenClaw peut considérer les Skills réservées à macOS comme éligibles lorsque les binaires
requis sont présents sur ce nœud. L’agent doit exécuter ces Skills
via l’outil `exec` avec `host=node`.

Cela repose sur le fait que le nœud signale sa prise en charge des commandes et sur une sonde de binaire
via `system.which` ou `system.run`. Les nœuds hors ligne ne rendent **pas**
les Skills distantes uniquement visibles. Si un nœud connecté cesse de répondre aux
sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
les Skills qui ne peuvent pas s’y exécuter actuellement.

## Impact en tokens

Lorsque des Skills sont éligibles, OpenClaw injecte une liste XML compacte des
Skills disponibles dans le prompt système (via `formatSkillsForPrompt` dans
`pi-coding-agent`). Le coût est déterministe :

- **Surcoût de base** (uniquement lorsqu’il y a ≥1 Skill) : 195 caractères.
- **Par Skill :** 97 caractères + la longueur des valeurs `<name>`, `<description>` et `<location>` échappées en XML.

Formule (caractères) :

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.),
ce qui augmente la longueur. Le nombre de tokens varie selon le tokenizer du modèle. Une estimation approximative
de style OpenAI est d’environ 4 caractères/token ; donc **97 caractères ≈ 24 tokens** par
Skill, plus les longueurs réelles de vos champs.

## Cycle de vie des Skills gérées

OpenClaw fournit un ensemble de base de Skills sous forme de **Skills groupées** avec
l’installation (paquet npm ou OpenClaw.app). `~/.openclaw/skills` existe pour
les remplacements locaux - par exemple, épingler ou corriger une Skill sans
modifier la copie groupée. Les Skills d’espace de travail appartiennent à l’utilisateur et remplacent
les deux en cas de conflits de noms.

## Vous cherchez davantage de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Configuration des Skills](/fr/tools/skills-config).

## Connexe

- [ClawHub](/fr/clawhub) - registre public de Skills
- [Créer des Skills](/fr/tools/creating-skills) - créer des Skills personnalisées
- [Plugins](/fr/tools/plugin) - vue d’ensemble du système de Plugins
- [Plugin Skill Workshop](/fr/plugins/skill-workshop) - générer des Skills à partir du travail d’agent
- [Configuration des Skills](/fr/tools/skills-config) - référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) - toutes les commandes slash disponibles
