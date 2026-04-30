---
read_when:
    - Ajout ou modification de Skills
    - Modification du contrôle d’accès des Skills, des listes d’autorisation ou des règles de chargement
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérés ou d’espace de travail, règles de contrôle, listes d’autorisation d’agents et câblage de la configuration'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)**
pour apprendre à l’agent à utiliser des outils. Chaque skill est un répertoire
contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw
charge les Skills intégrées plus les éventuelles substitutions locales, et les filtre
au moment du chargement selon l’environnement, la configuration et la présence des binaires.

## Emplacements et précédence

OpenClaw charge les Skills depuis ces sources, **par ordre de précédence décroissante** :

| #   | Source                    | Chemin                           |
| --- | ------------------------- | -------------------------------- |
| 1   | Skills d’espace de travail | `<workspace>/skills`             |
| 2   | Skills d’agent de projet  | `<workspace>/.agents/skills`     |
| 3   | Skills d’agent personnelles | `~/.agents/skills`               |
| 4   | Skills gérées/locales     | `~/.openclaw/skills`             |
| 5   | Skills intégrées          | livrées avec l’installation      |
| 6   | Dossiers de Skills supplémentaires | `skills.load.extraDirs` (config) |

Si un nom de skill entre en conflit, la source la plus prioritaire l’emporte.

Le répertoire natif `$CODEX_HOME/skills` de Codex CLI ne fait pas partie de ces
racines de Skills OpenClaw. En mode harnais Codex, les lancements locaux de serveur
d’application utilisent des répertoires Codex isolés par agent ; les Skills personnelles
de Codex CLI ne sont donc pas chargées implicitement.
Utilisez `openclaw migrate codex --dry-run` pour les inventorier et
`openclaw migrate codex` pour choisir les répertoires de Skills avec une invite
interactive à cases à cocher avant de les copier dans l’espace de travail de l’agent
OpenClaw actuel. Pour les exécutions non interactives, répétez `--skill <name>` pour
les Skills exactes à copier.

## Skills par agent et Skills partagées

Dans les configurations **multi-agent**, chaque agent possède son propre espace de travail :

| Portée               | Chemin                                      | Visible par                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| Par agent            | `<workspace>/skills`                        | Seulement cet agent          |
| Agent de projet      | `<workspace>/.agents/skills`                | Seulement l’agent de cet espace de travail |
| Agent personnel      | `~/.agents/skills`                          | Tous les agents sur cette machine |
| Partagé géré/local   | `~/.openclaw/skills`                        | Tous les agents sur cette machine |
| Répertoires supplémentaires partagés | `skills.load.extraDirs` (précédence la plus faible) | Tous les agents sur cette machine |

Même nom à plusieurs emplacements → la source la plus prioritaire l’emporte. L’espace de travail prime sur
l’agent de projet, qui prime sur l’agent personnel, qui prime sur le géré/local, qui prime sur l’intégré,
qui prime sur les répertoires supplémentaires.

## Listes d’autorisation des Skills d’agent

L’**emplacement** d’une skill et sa **visibilité** sont des contrôles distincts.
L’emplacement/la précédence décide quelle copie d’une skill de même nom l’emporte ; les
listes d’autorisation d’agent décident quelles Skills un agent peut réellement utiliser.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucune skill
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Règles de liste d’autorisation">
    - Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucune skill.
    - Une liste `agents.list[].skills` non vide est l’ensemble **final** pour cet
      agent — elle ne fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction du prompt, à la
      découverte des commandes slash de Skills, à la synchronisation du sandbox et aux instantanés de Skills.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent livrer leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du plugin). Les Skills de Plugin
sont chargées lorsque le plugin est activé. C’est l’endroit approprié pour les guides
d’utilisation propres à un outil qui sont trop longs pour la description de l’outil mais doivent être
disponibles chaque fois que le plugin est installé — par exemple, le plugin navigateur
livre une skill `browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de Skills de Plugin sont fusionnés dans le même chemin à faible précédence que
`skills.load.extraDirs`, donc une skill intégrée, gérée, d’agent ou d’espace de travail
portant le même nom les remplace. Vous pouvez les conditionner via
`metadata.openclaw.requires.config` dans l’entrée de configuration du plugin.

Consultez [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Outils](/fr/tools) pour
la surface d’outils que ces Skills enseignent.

## Atelier de Skills

Le plugin **Atelier de Skills** optionnel et expérimental peut créer ou mettre à jour
les Skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il
est désactivé par défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

L’Atelier de Skills écrit uniquement dans `<workspace>/skills`, analyse le contenu
généré, prend en charge l’approbation en attente ou les écritures sûres automatiques, met en quarantaine
les propositions non sûres et actualise l’instantané des Skills après les écritures
réussies afin que les nouvelles Skills deviennent disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections comme _« la prochaine fois, vérifier l’attribution du GIF »_ ou
des workflows durement acquis comme les listes de contrôle QA média. Commencez par l’approbation en attente ;
utilisez les écritures automatiques uniquement dans les espaces de travail de confiance après avoir examiné
ses propositions. Guide complet : [plugin Atelier de Skills](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public de Skills pour OpenClaw.
Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou la
CLI `clawhub` séparée pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/tools/clawhub).

| Action                             | Commande                               |
| ---------------------------------- | -------------------------------------- |
| Installer une skill dans l’espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour toutes les Skills installées | `openclaw skills update --all`         |
| Synchroniser (analyser + publier les mises à jour) | `clawhub sync --all`                   |

La commande native `openclaw skills install` installe dans le répertoire
`skills/` de l’espace de travail actif. La CLI `clawhub` séparée installe également dans
`./skills` sous votre répertoire de travail actuel (ou se rabat sur l’espace de travail
OpenClaw configuré). OpenClaw le détecte comme
`<workspace>/skills` à la session suivante.
Les racines de Skills configurées prennent aussi en charge un niveau de regroupement, comme
`skills/<group>/<skill>/SKILL.md`, afin que les Skills tierces liées puissent être
conservées dans un dossier partagé sans analyse récursive large.

Les pages de Skills ClawHub exposent le dernier état d’analyse de sécurité avant installation,
avec des pages de détail d’analyseur pour VirusTotal, ClawScan et l’analyse statique.
`openclaw skills install <slug>` reste uniquement le chemin d’installation ; les éditeurs
corrigent les faux positifs via le tableau de bord ClawHub ou
`clawhub skill rescan <slug>`.

## Sécurité

<Warning>
Traitez les Skills tierces comme du **code non fiable**. Lisez-les avant de les activer.
Privilégiez les exécutions en sandbox pour les entrées non fiables et les outils risqués. Consultez
[Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte des Skills d’espace de travail et de répertoire supplémentaire n’accepte que les racines de Skills et les fichiers `SKILL.md` dont le realpath résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de Skills adossées au Gateway (`skills.install`, onboarding et l’interface de paramètres Skills) exécutent l’analyseur intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les constats `critical` bloquent par défaut sauf si l’appelant définit explicitement la dérogation dangereuse ; les constats suspects ne font toujours qu’avertir.
- `openclaw skills install <slug>` est différent — il télécharge un dossier de skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent les secrets dans le processus **hôte** pour ce tour d’agent (pas dans le sandbox). Gardez les secrets hors des prompts et des journaux.

Pour un modèle de menace et des listes de contrôle plus larges, consultez [Sécurité](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit au minimum inclure :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la disposition/l’intention. L’analyseur utilisé
par l’agent intégré ne prend en charge que les clés de frontmatter **sur une seule ligne** ;
`metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans
les instructions pour référencer le chemin du dossier de la skill.

### Clés frontmatter optionnelles

<ParamField path="homepage" type="string">
  URL affichée comme « Website » dans l’interface Skills macOS. Également prise en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, la skill est exposée comme commande slash utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, la skill est exclue du prompt du modèle (toujours disponible via invocation utilisateur).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsqu’elle est définie sur `tool`, la commande slash contourne le modèle et est envoyée directement à un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour l’envoi vers un outil, transmet la chaîne d’arguments brute à l’outil (aucune analyse par le cœur). L’outil est invoqué avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Conditions (filtres au chargement)

OpenClaw filtre les Skills au moment du chargement avec `metadata` (JSON sur une seule ligne) :

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
  Lorsque `true`, inclut toujours la skill (ignore les autres conditions).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji optionnel utilisé par l’interface Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL optionnelle affichée comme « Website » dans l’interface Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste optionnelle de plateformes. Si elle est définie, la skill n’est éligible que sur ces OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Chacun doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Au moins l’un d’eux doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable d’environnement doit exister ou être fournie dans la configuration.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste des chemins `openclaw.json` qui doivent être truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spécifications d’installation optionnelles utilisées par l’interface Skills macOS (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n’est présent, la skill est toujours éligible (sauf si
elle est désactivée dans la configuration ou bloquée par `skills.allowBundled` pour les Skills intégrées).

<Note>
Les blocs hérités `metadata.clawdbot` sont toujours acceptés lorsque
`metadata.openclaw` est absent, afin que les anciennes Skills installées conservent leurs
conditions de dépendances et leurs indices d’installation. Les Skills nouvelles et mises à jour doivent utiliser
`metadata.openclaw`.
</Note>

### Notes de sandboxing

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement de la skill.
- Si un agent est en sandbox, le binaire doit aussi exister **dans le conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s’exécute une fois après la création du conteneur. Les installations de paquets nécessitent aussi une sortie réseau, un système de fichiers racine inscriptible et un utilisateur root dans le sandbox.
- Exemple : la skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize` dans le conteneur sandbox pour s’y exécuter.

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
  <Accordion title="Règles de sélection de l’installateur">
    - Si plusieurs installateurs sont indiqués, le Gateway choisit une seule option préférée (`brew` lorsqu’elle est disponible, sinon `node`).
    - Si tous les installateurs sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications d’installateur peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun). Cela affecte uniquement les installations de Skills ; l’environnement d’exécution du Gateway doit toujours être Node — Bun n’est pas recommandé pour WhatsApp/Telegram.
    - La sélection d’installateur adossée au Gateway est guidée par les préférences : lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew quand `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire Node configuré, puis les autres solutions de repli comme `go` ou `download`.
    - Si chaque spécification d’installation est `download`, OpenClaw expose toutes les options de téléchargement au lieu de les réduire à un installateur préféré.

  </Accordion>
  <Accordion title="Détails par installateur">
    - **Installations Go :** si `go` est absent et que `brew` est disponible, le Gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le répertoire `bin` de Homebrew lorsque c’est possible.
    - **Installations par téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : automatique lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Les Skills intégrés et gérés peuvent être activés/désactivés et recevoir des valeurs d’environnement
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
  `false` désactive la Skill même si elle est intégrée ou installée.
  La Skill intégrée `coding-agent` est optionnelle : définissez
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
  Conteneur facultatif pour les champs personnalisés propres à chaque Skill. Les clés personnalisées doivent se trouver ici.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative pour les Skills **intégrées** uniquement. Si elle est définie, seules les Skills intégrées de la liste sont éligibles (les Skills gérées/de l’espace de travail ne sont pas affectées).
</ParamField>

Si le nom de la Skill contient des traits d’union, mettez la clé entre guillemets
(JSON5 autorise les clés entre guillemets). Les clés de configuration correspondent par défaut au **nom de la Skill** — si une Skill
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d’images standard dans OpenClaw, utilisez l’outil central
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu
d’une Skill intégrée. Les exemples de Skills ici concernent des workflows personnalisés ou tiers.
Pour l’analyse d’images native, utilisez l’outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image propre à un fournisseur, ajoutez également
la clé d’authentification/API de ce fournisseur.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées de Skill.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit le prompt système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine après la fin de l’exécution.

L’injection d’environnement est **limitée à l’exécution de l’agent**, et non à un environnement shell
global.

Pour le backend intégré `claude-cli`, OpenClaw matérialise aussi le même
instantané éligible sous forme de Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur de Skills natif, tandis
qu’OpenClaw conserve la priorité, les listes d’autorisation par agent, le filtrage et
l’injection des clés d’environnement/API `skills.entries.*`. Les autres backends CLI utilisent uniquement le
catalogue de prompts.

## Instantanés et actualisation

OpenClaw prend un instantané des Skills éligibles **au démarrage d’une session** et
réutilise cette liste pour les tours suivants dans la même session. Les modifications apportées aux
Skills ou à la configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent être actualisées en cours de session dans deux cas :

- Le surveillant de Skills est activé.
- Un nouveau nœud distant éligible apparaît.

Considérez cela comme un **rechargement à chaud** : la liste actualisée est utilisée au
prochain tour de l’agent. Si la liste d’autorisation effective des Skills de l’agent change pour cette
session, OpenClaw actualise l’instantané afin que les Skills visibles restent alignées
avec l’agent actuel.

### Surveillant de Skills

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
OpenClaw peut considérer les Skills propres à macOS comme éligibles lorsque les
binaires requis sont présents sur ce nœud. L’agent doit exécuter ces Skills
via l’outil `exec` avec `host=node`.

Cela repose sur le nœud qui signale sa prise en charge des commandes et sur une vérification de binaire
via `system.which` ou `system.run`. Les nœuds hors ligne ne rendent **pas**
les Skills uniquement distantes visibles. Si un nœud connecté cesse de répondre aux
vérifications de binaires, OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
les Skills qui ne peuvent pas s’y exécuter actuellement.

## Impact sur les tokens

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
de style OpenAI est d’environ 4 caractères/token, donc **97 caractères ≈ 24 tokens** par
Skill, plus la longueur réelle de vos champs.

## Cycle de vie des Skills gérées

OpenClaw fournit un ensemble de base de Skills sous forme de **Skills intégrées** avec
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour les
remplacements locaux — par exemple, épingler ou corriger une Skill sans
modifier la copie intégrée. Les Skills de l’espace de travail appartiennent à l’utilisateur et remplacent
les deux en cas de conflits de nom.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Configuration des Skills](/fr/tools/skills-config).

## Connexe

- [ClawHub](/fr/tools/clawhub) — registre public de Skills
- [Créer des Skills](/fr/tools/creating-skills) — création de Skills personnalisées
- [Plugins](/fr/tools/plugin) — aperçu du système de Plugins
- [Plugin Skill Workshop](/fr/plugins/skill-workshop) — générer des Skills à partir du travail d’agent
- [Configuration des Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
