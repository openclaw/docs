---
read_when:
    - Ajouter ou modifier des Skills
    - Modifier le contrôle d’accès des Skills, les listes d’autorisation ou les règles de chargement
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérées ou d’espace de travail, règles de contrôle, listes d’autorisation des agents et câblage de la configuration'
title: Skills
x-i18n:
    generated_at: "2026-04-30T07:53:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser des outils. Chaque Skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les Skills intégrés ainsi que les remplacements locaux facultatifs, et les filtre au moment du chargement selon l’environnement, la configuration et la présence des binaires.

## Emplacements et précédence

OpenClaw charge les Skills depuis ces sources, **par précédence décroissante** :

| #   | Source                         | Chemin                           |
| --- | ------------------------------ | -------------------------------- |
| 1   | Skills de l’espace de travail  | `<workspace>/skills`             |
| 2   | Skills d’agent de projet       | `<workspace>/.agents/skills`     |
| 3   | Skills d’agent personnels      | `~/.agents/skills`               |
| 4   | Skills gérés/locaux            | `~/.openclaw/skills`             |
| 5   | Skills intégrés                | fournis avec l’installation      |
| 6   | Dossiers de Skills additionnels | `skills.load.extraDirs` (config) |

Si un nom de Skill entre en conflit, la source ayant la plus haute précédence l’emporte.

## Skills par agent et Skills partagés

Dans les configurations **multi-agent**, chaque agent possède son propre espace de travail :

| Portée                 | Chemin                                      | Visible par                  |
| ---------------------- | ------------------------------------------- | --------------------------- |
| Par agent              | `<workspace>/skills`                        | Cet agent uniquement        |
| Agent de projet        | `<workspace>/.agents/skills`                | L’agent de cet espace de travail uniquement |
| Agent personnel        | `~/.agents/skills`                          | Tous les agents de cette machine |
| Géré/local partagé     | `~/.openclaw/skills`                        | Tous les agents de cette machine |
| Dossiers additionnels partagés | `skills.load.extraDirs` (plus faible précédence) | Tous les agents de cette machine |

Même nom à plusieurs emplacements → la source ayant la plus haute précédence l’emporte. L’espace de travail prime sur
l’agent de projet, qui prime sur l’agent personnel, qui prime sur le géré/local, qui prime sur l’intégré,
qui prime sur les dossiers additionnels.

## Listes d’autorisation de Skills par agent

L’**emplacement** d’un Skill et la **visibilité** d’un Skill sont des contrôles distincts.
L’emplacement/la précédence décide quelle copie d’un Skill de même nom l’emporte ; les listes
d’autorisation d’agent décident quels Skills un agent peut réellement utiliser.

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
    - Définissez `agents.list[].skills: []` pour n’autoriser aucun Skill.
    - Une liste `agents.list[].skills` non vide est l’ensemble **final** pour cet
      agent — elle ne fusionne pas avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction du prompt, à la
      découverte des commandes slash de Skills, à la synchronisation du sandbox et aux instantanés de Skills.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les Plugins peuvent fournir leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin
se chargent lorsque le Plugin est activé. C’est le bon endroit pour les guides d’utilisation
propres à un outil qui sont trop longs pour la description de l’outil, mais qui doivent être
disponibles chaque fois que le Plugin est installé — par exemple, le Plugin de navigateur
fournit un Skill `browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de Skills de Plugin sont fusionnés dans le même chemin à faible précédence que
`skills.load.extraDirs`, donc un Skill intégré, géré, d’agent ou d’espace de travail portant le même nom
les remplace. Vous pouvez les conditionner via
`metadata.openclaw.requires.config` sur l’entrée de configuration du Plugin.

Consultez [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Outils](/fr/tools) pour
la surface d’outils que ces Skills enseignent.

## Skill Workshop

Le Plugin facultatif et expérimental **Skill Workshop** peut créer ou mettre à jour
des Skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il
est désactivé par défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu
généré, prend en charge l’approbation en attente ou les écritures sûres automatiques, met en quarantaine
les propositions non sûres et actualise l’instantané des Skills après les écritures réussies
afin que les nouveaux Skills deviennent disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections telles que _« la prochaine fois, vérifier l’attribution des GIF »_ ou
des workflows durement acquis comme des listes de contrôle QA média. Commencez par l’approbation en attente ;
n’utilisez les écritures automatiques que dans des espaces de travail de confiance après avoir examiné
ses propositions. Guide complet : [Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public de Skills pour OpenClaw.
Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou la
CLI séparée `clawhub` pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/tools/clawhub).

| Action                             | Commande                               |
| ---------------------------------- | -------------------------------------- |
| Installer un Skill dans l’espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour tous les Skills installés | `openclaw skills update --all`         |
| Synchroniser (analyser + publier les mises à jour) | `clawhub sync --all`                   |

La commande native `openclaw skills install` installe dans le répertoire
`skills/` de l’espace de travail actif. La CLI séparée `clawhub` installe aussi dans
`./skills` sous votre répertoire de travail actuel (ou revient à l’espace de travail
OpenClaw configuré). OpenClaw le détecte comme
`<workspace>/skills` à la session suivante.
Les racines de Skills configurées prennent aussi en charge un niveau de regroupement, comme
`skills/<group>/<skill>/SKILL.md`, afin que des Skills tiers liés puissent être
conservés sous un dossier partagé sans analyse récursive large.

Les pages de Skills ClawHub exposent le dernier état d’analyse de sécurité avant l’installation,
avec des pages de détail d’analyseur pour VirusTotal, ClawScan et l’analyse statique.
`openclaw skills install <slug>` reste uniquement le chemin d’installation ; les éditeurs
récupèrent les faux positifs via le tableau de bord ClawHub ou
`clawhub skill rescan <slug>`.

## Sécurité

<Warning>
Traitez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
Préférez les exécutions sandboxées pour les entrées non fiables et les outils risqués. Consultez
[Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte de Skills d’espace de travail et de dossiers additionnels n’accepte que les racines de Skills et les fichiers `SKILL.md` dont le realpath résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de Skills adossées au Gateway (`skills.install`, onboarding et l’interface de réglages Skills) exécutent l’analyseur de code dangereux intégré avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut, sauf si l’appelant définit explicitement le contournement de danger ; les résultats suspects continuent seulement d’avertir.
- `openclaw skills install <slug>` est différent — il télécharge un dossier de Skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte** pour ce tour d’agent (pas dans le sandbox). Gardez les secrets hors des prompts et des journaux.

Pour un modèle de menace et des listes de contrôle plus larges, consultez [Sécurité](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la disposition/l’intention. L’analyseur utilisé
par l’agent intégré prend en charge uniquement les clés de frontmatter **sur une seule ligne** ;
`metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans
les instructions pour référencer le chemin du dossier de Skill.

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Site web » dans l’interface macOS Skills. Aussi pris en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, le Skill est exposé comme commande slash utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, le Skill est exclu du prompt du modèle (il reste disponible via l’invocation utilisateur).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsqu’il est défini sur `tool`, la commande slash contourne le modèle et est dispatchée directement vers un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour le dispatch d’outil, transfère la chaîne d’arguments brute à l’outil (aucune analyse par le cœur). L’outil est invoqué avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
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
  Lorsque `true`, inclut toujours le Skill (ignore les autres conditions).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facultatif utilisé par l’interface macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL facultative affichée comme « Site web » dans l’interface macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste facultative de plateformes. Si elle est définie, le Skill n’est éligible que sur ces OS.
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
  Liste de chemins `openclaw.json` qui doivent être truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spécifications d’installation facultatives utilisées par l’interface macOS Skills (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n’est présent, le Skill est toujours éligible (sauf s’il est
désactivé dans la configuration ou bloqué par `skills.allowBundled` pour les Skills intégrés).

<Note>
Les blocs hérités `metadata.clawdbot` sont toujours acceptés lorsque
`metadata.openclaw` est absent, afin que les anciens Skills installés conservent leurs
conditions de dépendances et leurs indices d’installation. Les Skills nouveaux et mis à jour doivent utiliser
`metadata.openclaw`.
</Note>

### Notes sur le sandboxing

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement du Skill.
- Si un agent est sandboxé, le binaire doit aussi exister **dans le conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s’exécute une fois après la création du conteneur. Les installations de paquets exigent aussi une sortie réseau, un système de fichiers racine accessible en écriture et un utilisateur root dans le sandbox.
- Exemple : le Skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize` dans le conteneur sandbox pour s’y exécuter.

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
    - Si plusieurs installateurs sont listés, le Gateway choisit une seule option préférée (brew lorsqu’il est disponible, sinon node).
    - Si tous les installateurs sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications d’installateur peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun). Cela n’affecte que les installations de Skills ; l’environnement d’exécution du Gateway doit toujours être Node — Bun n’est pas recommandé pour WhatsApp/Telegram.
    - La sélection d’installateur adossée au Gateway est pilotée par les préférences : lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire node configuré, puis les autres solutions de secours comme `go` ou `download`.
    - Si chaque spécification d’installation est `download`, OpenClaw affiche toutes les options de téléchargement au lieu de les réduire à un seul installateur préféré.

  </Accordion>
  <Accordion title="Détails par installateur">
    - **Installations Go :** si `go` est manquant et que `brew` est disponible, le gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
    - **Installations par téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Remplacements de configuration

Les Skills groupés et gérés peuvent être activés/désactivés et recevoir des valeurs d’environnement
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
  `false` désactive le Skill même s’il est groupé ou installé.
  Le Skill groupé `coding-agent` est optionnel : définissez
  `skills.entries.coding-agent.enabled: true` avant de l’exposer aux agents,
  puis assurez-vous que l’un de `claude`, `codex`, `opencode` ou `pi` est installé et
  authentifié pour sa propre CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Raccourci pour les Skills qui déclarent `metadata.openclaw.primaryEnv`. Prend en charge le texte en clair ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injecté uniquement si la variable n’est pas déjà définie dans le processus.
</ParamField>
<ParamField path="config" type="object">
  Conteneur optionnel pour les champs personnalisés propres à chaque Skill. Les clés personnalisées doivent se trouver ici.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation optionnelle pour les Skills **groupés** uniquement. Si elle est définie, seuls les Skills groupés de la liste sont éligibles (les Skills gérés/de workspace ne sont pas affectés).
</ParamField>

Si le nom du Skill contient des traits d’union, mettez la clé entre guillemets (JSON5 autorise les
clés entre guillemets). Les clés de configuration correspondent au **nom du Skill** par défaut — si un Skill
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d’images stock dans OpenClaw, utilisez l’outil central
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu
d’un Skill groupé. Les exemples de Skills ici concernent des workflows personnalisés ou tiers.
Pour l’analyse d’image native, utilisez l’outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image propre à un fournisseur, ajoutez aussi la clé
d’auth/API de ce fournisseur.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées du Skill.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit le prompt système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine une fois l’exécution terminée.

L’injection d’environnement est **limitée à l’exécution de l’agent**, et non à un environnement
shell global.

Pour le backend groupé `claude-cli`, OpenClaw matérialise aussi le même
instantané éligible comme Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut ensuite utiliser son résolveur de Skills natif tandis
qu’OpenClaw conserve la précédence, les listes d’autorisation par agent, le contrôle d’accès et
l’injection de clés d’environnement/API `skills.entries.*`. Les autres backends CLI utilisent uniquement le
catalogue de prompts.

## Instantanés et actualisation

OpenClaw prend un instantané des Skills éligibles **au démarrage d’une session** et
réutilise cette liste pour les tours suivants dans la même session. Les changements apportés aux
Skills ou à la configuration prennent effet lors de la prochaine nouvelle session.

Les Skills peuvent être actualisés en cours de session dans deux cas :

- L’observateur de Skills est activé.
- Un nouveau nœud distant éligible apparaît.

Considérez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au
prochain tour de l’agent. Si la liste d’autorisation effective des Skills de l’agent change pour cette
session, OpenClaw actualise l’instantané afin que les Skills visibles restent alignés
avec l’agent actuel.

### Observateur de Skills

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané des Skills
lorsque des fichiers `SKILL.md` changent. Configurez sous `skills.load` :

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

Si le Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté avec
`system.run` autorisé (la sécurité des approbations Exec n’étant pas définie sur `deny`),
OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque les binaires requis
sont présents sur ce nœud. L’agent doit exécuter ces Skills
via l’outil `exec` avec `host=node`.

Cela repose sur le signalement par le nœud de sa prise en charge des commandes et sur une sonde de binaires
via `system.which` ou `system.run`. Les nœuds hors ligne ne rendent **pas**
les Skills réservés aux nœuds distants visibles. Si un nœud connecté cesse de répondre aux sondes de binaires,
OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
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

L’échappement XML transforme `& < > " '` en entités (`&amp;`, `&lt;`, etc.),
ce qui augmente la longueur. Le nombre de tokens varie selon le tokenizer du modèle. Une estimation
approximative de style OpenAI est ~4 caractères/token, donc **97 caractères ≈ 24 tokens** par
Skill, auxquels s’ajoutent les longueurs réelles de vos champs.

## Cycle de vie des Skills gérés

OpenClaw fournit un ensemble de base de Skills comme **Skills groupés** avec
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour
les remplacements locaux — par exemple pour épingler ou corriger un Skill sans
modifier la copie groupée. Les Skills de workspace appartiennent à l’utilisateur et remplacent
les deux autres en cas de conflit de noms.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Configuration des Skills](/fr/tools/skills-config).

## Connexe

- [ClawHub](/fr/tools/clawhub) — registre public de Skills
- [Créer des Skills](/fr/tools/creating-skills) — créer des Skills personnalisés
- [Plugins](/fr/tools/plugin) — vue d’ensemble du système de Plugin
- [Plugin Skill Workshop](/fr/plugins/skill-workshop) — générer des Skills à partir du travail d’agent
- [Configuration des Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
