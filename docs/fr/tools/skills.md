---
read_when:
    - Ajout ou modification de Skills
    - Modification du filtrage des Skills, des listes d’autorisation ou des règles de chargement
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérés ou d’espace de travail, règles de contrôle, listes d’autorisation des agents et câblage de la configuration'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser les outils. Chaque Skill est un répertoire contenant un fichier `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les Skills intégrés ainsi que les remplacements locaux facultatifs, et les filtre au moment du chargement selon l’environnement, la configuration et la présence des binaires.

## Emplacements et précédence

OpenClaw charge les Skills depuis ces sources, **de la plus haute précédence à la plus basse** :

| #   | Source                         | Chemin                           |
| --- | ------------------------------ | -------------------------------- |
| 1   | Skills de l’espace de travail  | `<workspace>/skills`             |
| 2   | Skills d’agent du projet       | `<workspace>/.agents/skills`     |
| 3   | Skills d’agent personnels      | `~/.agents/skills`               |
| 4   | Skills gérés/locaux            | `~/.openclaw/skills`             |
| 5   | Skills intégrés                | fournis avec l’installation      |
| 6   | Dossiers de Skills additionnels | `skills.load.extraDirs` (config) |

Si un nom de Skill entre en conflit, la source la plus haute l’emporte.

Le répertoire natif `$CODEX_HOME/skills` de Codex CLI ne fait pas partie de ces racines de Skills OpenClaw. En mode harnais Codex, les lancements locaux d’app-server utilisent des environnements Codex isolés par agent, donc les Skills personnelles de Codex CLI ne sont pas chargées implicitement. Utilisez `openclaw migrate codex --dry-run` pour les inventorier et `openclaw migrate codex` pour choisir les répertoires de Skills avec une invite interactive à cases à cocher avant de les copier dans l’espace de travail de l’agent OpenClaw actuel. Pour les exécutions non interactives, répétez `--skill <name>` pour les Skills exactes à copier.

## Skills par agent et Skills partagées

Dans les configurations **multi-agent**, chaque agent possède son propre espace de travail :

| Portée               | Chemin                                      | Visible par                         |
| -------------------- | ------------------------------------------- | ----------------------------------- |
| Par agent            | `<workspace>/skills`                        | Seulement cet agent                 |
| Agent de projet      | `<workspace>/.agents/skills`                | Seulement l’agent de cet espace de travail |
| Agent personnel      | `~/.agents/skills`                          | Tous les agents sur cette machine   |
| Géré/local partagé   | `~/.openclaw/skills`                        | Tous les agents sur cette machine   |
| Répertoires supplémentaires partagés | `skills.load.extraDirs` (précédence la plus basse) | Tous les agents sur cette machine |

Même nom à plusieurs endroits → la source la plus haute l’emporte. L’espace de travail l’emporte sur l’agent de projet, qui l’emporte sur l’agent personnel, qui l’emporte sur le géré/local, qui l’emporte sur l’intégré, qui l’emporte sur les répertoires supplémentaires.

## Listes d’autorisation des Skills d’agent

L’**emplacement** des Skills et leur **visibilité** sont des contrôles distincts. L’emplacement/la précédence détermine quelle copie d’une Skill portant le même nom l’emporte ; les listes d’autorisation d’agent déterminent quelles Skills un agent peut réellement utiliser.

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
    - Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucune Skill.
    - Une liste `agents.list[].skills` non vide est l’ensemble **final** pour cet agent — elle ne fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction des prompts, à la découverte des slash commands de Skills, à la synchronisation de la sandbox et aux instantanés de Skills.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent embarquer leurs propres Skills en listant des répertoires `skills` dans `openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin sont chargées lorsque le Plugin est activé. C’est le bon emplacement pour les guides d’exploitation propres à un outil qui sont trop longs pour la description de l’outil mais doivent être disponibles chaque fois que le Plugin est installé — par exemple, le Plugin de navigateur fournit une Skill `browser-automation` pour le contrôle du navigateur en plusieurs étapes.

Les répertoires de Skills de Plugin sont fusionnés dans le même chemin à basse précédence que `skills.load.extraDirs`, donc une Skill intégrée, gérée, d’agent ou d’espace de travail portant le même nom les remplace. Vous pouvez les conditionner via `metadata.openclaw.requires.config` sur l’entrée de configuration du Plugin.

Consultez [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Outils](/fr/tools) pour la surface d’outils que ces Skills enseignent.

## Skill Workshop

Le Plugin **Skill Workshop**, facultatif et expérimental, peut créer ou mettre à jour des Skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il est désactivé par défaut et doit être activé explicitement via `plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu généré, prend en charge l’approbation en attente ou les écritures sûres automatiques, met en quarantaine les propositions non sûres et actualise l’instantané des Skills après les écritures réussies afin que les nouvelles Skills soient disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections comme _« la prochaine fois, vérifier l’attribution du GIF »_ ou pour des workflows durement acquis comme des listes de contrôle QA média. Commencez par l’approbation en attente ; n’utilisez les écritures automatiques que dans des espaces de travail fiables après avoir examiné ses propositions. Guide complet : [Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public de Skills pour OpenClaw. Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou le CLI séparé `clawhub` pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/tools/clawhub).

| Action                                  | Commande                               |
| --------------------------------------- | -------------------------------------- |
| Installer une Skill dans l’espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour toutes les Skills installées | `openclaw skills update --all`         |
| Synchroniser (analyser + publier les mises à jour) | `clawhub sync --all`                   |

La commande native `openclaw skills install` installe dans le répertoire `skills/` de l’espace de travail actif. Le CLI séparé `clawhub` installe également dans `./skills` sous votre répertoire de travail actuel (ou se rabat sur l’espace de travail OpenClaw configuré). OpenClaw le récupère comme `<workspace>/skills` à la session suivante.
Les racines de Skills configurées prennent aussi en charge un niveau de regroupement, comme `skills/<group>/<skill>/SKILL.md`, afin que des Skills tierces liées puissent être conservées dans un dossier partagé sans analyse récursive large.

Les pages de Skills ClawHub exposent le dernier état d’analyse de sécurité avant installation, avec des pages de détail d’analyse pour VirusTotal, ClawScan et l’analyse statique. `openclaw skills install <slug>` reste uniquement le chemin d’installation ; les éditeurs corrigent les faux positifs via le tableau de bord ClawHub ou `clawhub skill rescan <slug>`.

## Sécurité

<Warning>
Traitez les Skills tierces comme du **code non fiable**. Lisez-les avant de les activer. Préférez les exécutions en sandbox pour les entrées non fiables et les outils risqués. Consultez [Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte des Skills d’espace de travail et de répertoire supplémentaire n’accepte que les racines de Skills et les fichiers `SKILL.md` dont le realpath résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de Skills adossées au Gateway (`skills.install`, onboarding et l’interface de paramètres Skills) exécutent l’analyseur intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut sauf si l’appelant définit explicitement le contournement dangereux ; les résultats suspects avertissent seulement.
- `openclaw skills install <slug>` est différent — il télécharge un dossier de Skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte** pour ce tour d’agent (pas dans la sandbox). Gardez les secrets hors des prompts et des journaux.

Pour un modèle de menace et des listes de contrôle plus larges, consultez [Sécurité](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la disposition/l’intention. L’analyseur utilisé par l’agent intégré ne prend en charge que les clés de frontmatter **sur une seule ligne** ; `metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier de Skill.

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Site web » dans l’interface macOS Skills. Également prise en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, la Skill est exposée comme slash command utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, OpenClaw exclut les instructions de la Skill du prompt normal de l’agent. La Skill reste installée et peut toujours être exécutée explicitement comme slash command lorsque `user-invocable` vaut aussi `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsque défini sur `tool`, la slash command contourne le modèle et est distribuée directement à un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l’outil à appeler lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la distribution d’outil, transmet la chaîne brute d’arguments à l’outil (sans analyse par le cœur). L’outil est appelé avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtres au chargement)

OpenClaw filtre les Skills au moment du chargement à l’aide de `metadata` (JSON sur une seule ligne) :

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
  Lorsque `true`, inclut toujours la Skill (ignore les autres conditions).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facultatif utilisé par l’interface macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL facultative affichée comme « Site web » dans l’interface macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste facultative de plateformes. Si elle est définie, la Skill n’est éligible que sur ces OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Chacun doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Au moins un doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable d’environnement doit exister ou être fournie dans la configuration.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste de chemins `openclaw.json` qui doivent être évalués comme vrais.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spécifications d’installation facultatives utilisées par l’interface macOS Skills (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n’est présent, la Skill est toujours éligible (sauf si elle est désactivée dans la configuration ou bloquée par `skills.allowBundled` pour les Skills intégrées).

<Note>
Les blocs hérités `metadata.clawdbot` sont toujours acceptés lorsque `metadata.openclaw` est absent, afin que les anciennes Skills installées conservent leurs conditions de dépendances et leurs indications d’installation. Les Skills nouvelles et mises à jour doivent utiliser `metadata.openclaw`.
</Note>

### Notes sur le sandboxing

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement de la Skill.
- Si un agent est en sandbox, le binaire doit aussi exister **dans le conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s’exécute une fois après la création du conteneur. Les installations de paquets nécessitent aussi une sortie réseau, un système de fichiers racine accessible en écriture et un utilisateur root dans la sandbox.
- Exemple : la Skill `summarize` (`skills/summarize/SKILL.md`) a besoin du CLI `summarize` dans le conteneur sandbox pour s’y exécuter.

### Spécifications des programmes d’installation

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
    - Si plusieurs programmes d’installation sont répertoriés, le Gateway choisit une seule option préférée (`brew` lorsqu’il est disponible, sinon `node`).
    - Si tous les programmes d’installation sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications des programmes d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun). Cela affecte uniquement les installations de Skills ; l’environnement d’exécution du Gateway doit toujours être Node — Bun n’est pas recommandé pour WhatsApp/Telegram.
    - La sélection de programmes d’installation adossée au Gateway est pilotée par les préférences : lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire Node configuré, puis les autres solutions de repli comme `go` ou `download`.
    - Si chaque spécification d’installation est `download`, OpenClaw affiche toutes les options de téléchargement au lieu de les réduire à un seul programme d’installation préféré.

  </Accordion>
  <Accordion title="Détails par programme d’installation">
    - **Installations Go :** si `go` est manquant et que `brew` est disponible, le Gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
    - **Installations par téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Les Skills groupés et gérés peuvent être activés ou désactivés et recevoir des valeurs d’environnement
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
  `false` désactive le skill même s’il est groupé ou installé.
  Le skill groupé `coding-agent` est optionnel : définissez
  `skills.entries.coding-agent.enabled: true` avant de l’exposer aux agents,
  puis assurez-vous que l’un de `claude`, `codex`, `opencode` ou `pi` est installé et
  authentifié pour sa propre CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Raccourci pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`. Prend en charge le texte brut ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injecté uniquement si la variable n’est pas déjà définie dans le processus.
</ParamField>
<ParamField path="config" type="object">
  Conteneur facultatif pour les champs personnalisés propres à chaque skill. Les clés personnalisées doivent se trouver ici.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative pour les Skills **groupés** uniquement. Si elle est définie, seuls les Skills groupés de la liste sont éligibles (les Skills gérés/de l’espace de travail ne sont pas affectés).
</ParamField>

Si le nom du skill contient des traits d’union, mettez la clé entre guillemets (JSON5 autorise les
clés entre guillemets). Les clés de configuration correspondent par défaut au **nom du skill** — si un skill
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d’images standard dans OpenClaw, utilisez l’outil cœur
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu
d’un skill groupé. Les exemples de Skills ici concernent les workflows personnalisés ou tiers. Pour l’analyse d’images native, utilisez l’outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image propre à un fournisseur, ajoutez également
la clé d’authentification/API de ce fournisseur.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées des Skills.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit l’invite système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine une fois l’exécution terminée.

L’injection d’environnement est **limitée à l’exécution de l’agent**, et non à un environnement shell
global.

Pour le backend `claude-cli` groupé, OpenClaw matérialise aussi le même
instantané éligible sous forme de Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur de Skills natif pendant
qu’OpenClaw conserve la maîtrise de la priorité, des listes d’autorisation par agent, du gating et de
l’injection d’environnement/de clé API `skills.entries.*`. Les autres backends CLI utilisent uniquement le
catalogue d’invite.

## Instantanés et actualisation

OpenClaw prend un instantané des Skills éligibles **au démarrage d’une session** et
réutilise cette liste pour les tours suivants dans la même session. Les changements apportés aux
Skills ou à la configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent être actualisés en cours de session dans deux cas :

- L’observateur de Skills est activé.
- Un nouveau nœud distant éligible apparaît.

Considérez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au
tour d’agent suivant. Si la liste d’autorisation effective des Skills de l’agent change pour cette
session, OpenClaw actualise l’instantané afin que les Skills visibles restent alignés
sur l’agent actuel.

### Observateur de Skills

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané des Skills
lorsque les fichiers `SKILL.md` changent. Configurez sous `skills.load` :

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Nœuds macOS distants (Gateway Linux)

Si le Gateway s’exécute sous Linux mais qu’un **nœud macOS** est connecté avec
`system.run` autorisé (sécurité des approbations Exec non définie sur `deny`),
OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque les binaires requis
sont présents sur ce nœud. L’agent doit exécuter ces Skills
via l’outil `exec` avec `host=node`.

Cela repose sur la déclaration par le nœud de sa prise en charge des commandes et sur une sonde de binaire
via `system.which` ou `system.run`. Les nœuds hors ligne ne rendent **pas**
visibles les Skills uniquement distants. Si un nœud connecté cesse de répondre aux
sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
les Skills qui ne peuvent pas actuellement s’y exécuter.

## Impact sur les tokens

Lorsque des Skills sont éligibles, OpenClaw injecte une liste XML compacte des
Skills disponibles dans l’invite système (via `formatSkillsForPrompt` dans
`pi-coding-agent`). Le coût est déterministe :

- **Surcoût de base** (uniquement lorsqu’il y a ≥1 skill) : 195 caractères.
- **Par skill :** 97 caractères + la longueur des valeurs XML échappées `<name>`, `<description>` et `<location>`.

Formule (caractères) :

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.),
ce qui augmente la longueur. Le nombre de tokens varie selon le tokenizer du modèle. Une estimation approximative
de style OpenAI est d’environ 4 caractères/token, donc **97 caractères ≈ 24 tokens** par
skill, plus les longueurs réelles de vos champs.

## Cycle de vie des Skills gérés

OpenClaw fournit un ensemble de base de Skills comme **Skills groupés** avec
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour
les remplacements locaux — par exemple, épingler ou corriger un skill sans
modifier la copie groupée. Les Skills de l’espace de travail appartiennent à l’utilisateur et remplacent
les deux autres en cas de conflits de noms.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Configuration des Skills](/fr/tools/skills-config).

## Connexe

- [ClawHub](/fr/tools/clawhub) — registre public de Skills
- [Créer des Skills](/fr/tools/creating-skills) — créer des Skills personnalisés
- [Plugins](/fr/tools/plugin) — aperçu du système de Plugin
- [Plugin Skill Workshop](/fr/plugins/skill-workshop) — générer des Skills à partir du travail des agents
- [Configuration des Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
