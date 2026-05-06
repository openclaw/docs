---
read_when:
    - Ajouter ou modifier des Skills
    - Modifier le contrôle d’accès des Skills, les listes d’autorisation ou les règles de chargement
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérées ou d’espace de travail, règles de validation, listes d’autorisation d’agents et câblage de la configuration'
title: Skills
x-i18n:
    generated_at: "2026-05-06T07:42:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw utilise des dossiers de skills **compatibles [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser des outils. Chaque skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les skills intégrées ainsi que les remplacements locaux facultatifs, puis les filtre au moment du chargement selon l’environnement, la configuration et la présence de binaires.

## Emplacements et précédence

OpenClaw charge les skills depuis ces sources, **par ordre de précédence décroissante** :

| #   | Source                       | Chemin                           |
| --- | ---------------------------- | -------------------------------- |
| 1   | Skills de l’espace de travail | `<workspace>/skills`             |
| 2   | Skills d’agent du projet      | `<workspace>/.agents/skills`     |
| 3   | Skills d’agent personnelles   | `~/.agents/skills`               |
| 4   | Skills gérées/locales         | `~/.openclaw/skills`             |
| 5   | Skills intégrées              | fournies avec l’installation     |
| 6   | Dossiers de skills en plus    | `skills.load.extraDirs` (config) |

Si un nom de skill entre en conflit, la source la plus prioritaire l’emporte.

Le répertoire natif `$CODEX_HOME/skills` de la CLI Codex ne fait pas partie de ces racines de skills OpenClaw. En mode harnais Codex, les lancements de serveur d’application local utilisent des domiciles Codex isolés par agent, donc les skills personnelles de la CLI Codex ne sont pas chargées implicitement. Utilisez `openclaw migrate codex --dry-run` pour les inventorier et `openclaw migrate codex` pour choisir les répertoires de skills avec une invite interactive à cases à cocher avant de les copier dans l’espace de travail de l’agent OpenClaw actuel. Pour les exécutions non interactives, répétez `--skill <name>` pour les skills exactes à copier.

## Skills par agent et skills partagées

Dans les configurations **multi-agent**, chaque agent possède son propre espace de travail :

| Portée                 | Chemin                                      | Visible par                         |
| ---------------------- | ------------------------------------------- | ----------------------------------- |
| Par agent              | `<workspace>/skills`                        | Uniquement cet agent                |
| Agent de projet        | `<workspace>/.agents/skills`                | Uniquement l’agent de cet espace de travail |
| Agent personnel        | `~/.agents/skills`                          | Tous les agents sur cette machine   |
| Gérées/locales partagées | `~/.openclaw/skills`                      | Tous les agents sur cette machine   |
| Répertoires supplémentaires partagés | `skills.load.extraDirs` (précédence la plus faible) | Tous les agents sur cette machine   |

Même nom à plusieurs emplacements → la source la plus prioritaire l’emporte. L’espace de travail l’emporte sur l’agent de projet, qui l’emporte sur l’agent personnel, qui l’emporte sur les skills gérées/locales, qui l’emportent sur les skills intégrées, qui l’emportent sur les répertoires supplémentaires.

## Listes d’autorisation de skills d’agent

L’**emplacement** d’une skill et sa **visibilité** sont deux contrôles distincts. L’emplacement/la précédence décide quelle copie d’une skill portant le même nom l’emporte ; les listes d’autorisation d’agent décident quelles skills un agent peut réellement utiliser.

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
    - Omettez `agents.defaults.skills` pour autoriser les skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n’autoriser aucune skill.
    - Une liste `agents.list[].skills` non vide constitue l’ensemble **final** pour cet agent - elle n’est pas fusionnée avec les valeurs par défaut.
    - La liste d’autorisation effective s’applique à la construction des prompts, à la découverte des commandes slash de skills, à la synchronisation du bac à sable et aux instantanés de skills.
  </Accordion>
</AccordionGroup>

## Plugins et skills

Les Plugins peuvent fournir leurs propres skills en listant des répertoires `skills` dans `openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les skills de Plugin se chargent lorsque le Plugin est activé. C’est le bon emplacement pour les guides d’utilisation propres à un outil qui sont trop longs pour la description de l’outil mais qui doivent être disponibles chaque fois que le Plugin est installé - par exemple, le Plugin de navigateur fournit une skill `browser-automation` pour le contrôle de navigateur en plusieurs étapes.

Les répertoires de skills de Plugin sont fusionnés dans le même chemin à faible précédence que `skills.load.extraDirs`, donc une skill intégrée, gérée, d’agent ou d’espace de travail portant le même nom les remplace. Vous pouvez les conditionner via `metadata.openclaw.requires.config` sur l’entrée de configuration du Plugin.

Consultez [Plugins](/fr/tools/plugin) pour la découverte/la configuration et [Outils](/fr/tools) pour la surface d’outils que ces skills enseignent.

## Skill Workshop

Le Plugin expérimental facultatif **Skill Workshop** peut créer ou mettre à jour des skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il est désactivé par défaut et doit être explicitement activé via `plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu généré, prend en charge l’approbation en attente ou les écritures sûres automatiques, met en quarantaine les propositions non sûres et actualise l’instantané des skills après les écritures réussies afin que les nouvelles skills deviennent disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections comme _« la prochaine fois, vérifier l’attribution du GIF »_ ou des workflows acquis avec difficulté comme des listes de contrôle QA multimédia. Commencez avec l’approbation en attente ; utilisez les écritures automatiques uniquement dans des espaces de travail de confiance après avoir examiné ses propositions. Guide complet : [Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public de skills pour OpenClaw. Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou la CLI `clawhub` séparée pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/tools/clawhub).

| Action                                      | Commande                               |
| ------------------------------------------- | -------------------------------------- |
| Installer une skill dans l’espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour toutes les skills installées  | `openclaw skills update --all`         |
| Synchroniser (analyser + publier les mises à jour) | `clawhub sync --all`             |

La commande native `openclaw skills install` installe dans le répertoire `skills/` de l’espace de travail actif. La CLI `clawhub` séparée installe aussi dans `./skills` sous votre répertoire de travail actuel (ou se rabat sur l’espace de travail OpenClaw configuré). OpenClaw le reprend comme `<workspace>/skills` à la session suivante.
Les racines de skills configurées prennent aussi en charge un niveau de regroupement, comme `skills/<group>/<skill>/SKILL.md`, afin que les skills tierces liées puissent être conservées dans un dossier partagé sans analyse récursive large.

Les pages de skills ClawHub exposent le dernier état d’analyse de sécurité avant l’installation, avec des pages de détail d’analyseur pour VirusTotal, ClawScan et l’analyse statique. `openclaw skills install <slug>` reste uniquement le chemin d’installation ; les éditeurs récupèrent les faux positifs via le tableau de bord ClawHub ou `clawhub skill rescan <slug>`.

## Sécurité

<Warning>
Traitez les skills tierces comme du **code non fiable**. Lisez-les avant de les activer. Préférez les exécutions en bac à sable pour les entrées non fiables et les outils risqués. Consultez [Bac à sable](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte des skills d’espace de travail et de répertoire supplémentaire accepte uniquement les racines de skills et les fichiers `SKILL.md` dont le chemin réel résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de skills adossées au Gateway (`skills.install`, l’onboarding et l’interface de paramètres Skills) exécutent l’analyseur intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut sauf si l’appelant définit explicitement le contournement dangereux ; les résultats suspects continuent seulement d’avertir.
- `openclaw skills install <slug>` est différent - il télécharge un dossier de skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte** pour ce tour d’agent (pas dans le bac à sable). Gardez les secrets hors des prompts et des journaux.

Pour un modèle de menace plus large et des listes de contrôle, consultez [Sécurité](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la disposition/l’intention. Le parseur utilisé par l’agent intégré prend en charge uniquement les clés de frontmatter **sur une seule ligne** ; `metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier de la skill.

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Site web » dans l’interface Skills macOS. Également prise en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quand `true`, la skill est exposée comme commande slash utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quand `true`, OpenClaw garde les instructions de la skill hors du prompt normal de l’agent. La skill reste installée et peut toujours être exécutée explicitement comme commande slash lorsque `user-invocable` vaut aussi `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsque défini sur `tool`, la commande slash contourne le modèle et est distribuée directement à un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour la distribution vers un outil, transmet la chaîne d’arguments brute à l’outil (sans analyse par le cœur). L’outil est invoqué avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
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
  Quand `true`, inclut toujours la skill (ignore les autres conditions).
</ParamField>
<ParamField path="emoji" type="string">
  Émoji facultatif utilisé par l’interface Skills macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL facultative affichée comme « Site web » dans l’interface Skills macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste facultative de plateformes. Si elle est définie, la skill n’est éligible que sur ces OS.
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
  Spécifications d’installation facultatives utilisées par l’interface Skills macOS (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n’est présent, la skill est toujours éligible (sauf si elle est désactivée dans la configuration ou bloquée par `skills.allowBundled` pour les skills intégrées).

<Note>
Les blocs hérités `metadata.clawdbot` sont toujours acceptés lorsque `metadata.openclaw` est absent, afin que les skills installées plus anciennes conservent leurs conditions de dépendances et leurs indications d’installation. Les skills nouvelles et mises à jour doivent utiliser `metadata.openclaw`.
</Note>

### Notes sur le bac à sable

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement de la skill.
- Si un agent est exécuté en bac à sable, le binaire doit aussi exister **à l’intérieur du conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s’exécute une fois après la création du conteneur. Les installations de paquets nécessitent également une sortie réseau, un FS racine accessible en écriture et un utilisateur root dans le bac à sable.
- Exemple : la skill `summarize` (`skills/summarize/SKILL.md`) a besoin de la CLI `summarize` dans le conteneur de bac à sable pour s’y exécuter.

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
    - Si plusieurs installateurs sont répertoriés, le Gateway choisit une seule option préférée (brew lorsqu’il est disponible, sinon node).
    - Si tous les installateurs sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun). Cela affecte uniquement les installations de compétences ; l’environnement d’exécution Gateway doit toujours être Node - Bun n’est pas recommandé pour WhatsApp/Telegram.
    - La sélection d’installateur appuyée par le Gateway est guidée par les préférences : lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew quand `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire node configuré, puis les autres solutions de repli comme `go` ou `download`.
    - Si chaque spécification d’installation est `download`, OpenClaw expose toutes les options de téléchargement au lieu de les réduire à un seul installateur préféré.

  </Accordion>
  <Accordion title="Per-installer details">
    - **Installations Go :** si `go` est absent et que `brew` est disponible, le gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
    - **Installations par téléchargement :** `url` (requis), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Surcharges de configuration

Les compétences groupées et gérées peuvent être activées/désactivées et recevoir des valeurs d’environnement
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
  `false` désactive la compétence même si elle est groupée ou installée.
  La compétence groupée `coding-agent` est optionnelle : définissez
  `skills.entries.coding-agent.enabled: true` avant de l’exposer aux agents,
  puis assurez-vous que l’un de `claude`, `codex`, `opencode` ou `pi` est installé et
  authentifié pour sa propre CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Raccourci pour les compétences qui déclarent `metadata.openclaw.primaryEnv`. Prend en charge le texte en clair ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injecté uniquement si la variable n’est pas déjà définie dans le processus.
</ParamField>
<ParamField path="config" type="object">
  Objet facultatif pour les champs personnalisés propres à chaque compétence. Les clés personnalisées doivent se trouver ici.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d’autorisation facultative pour les compétences **groupées** uniquement. Si elle est définie, seules les compétences groupées de la liste sont éligibles (les compétences gérées/de l’espace de travail ne sont pas affectées).
</ParamField>

Si le nom de la compétence contient des traits d’union, mettez la clé entre guillemets (JSON5 autorise les
clés entre guillemets). Les clés de configuration correspondent au **nom de la compétence** par défaut - si une compétence
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d’images de stock dans OpenClaw, utilisez l’outil principal
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu
d’une compétence groupée. Les exemples de compétences ici concernent les workflows personnalisés ou tiers.
Pour l’analyse d’images native, utilisez l’outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d’image propre à un fournisseur, ajoutez également la clé
d’authentification/API de ce fournisseur.
</Note>

## Injection d’environnement

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées de compétence.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit le prompt système avec les compétences **éligibles**.
4. Restaure l’environnement d’origine après la fin de l’exécution.

L’injection d’environnement est **limitée à l’exécution de l’agent**, et non à un environnement shell
global.

Pour le backend groupé `claude-cli`, OpenClaw matérialise également le même
instantané éligible sous forme de Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur de compétences natif tandis
qu’OpenClaw conserve la propriété de la précédence, des listes d’autorisation par agent, du filtrage et de
l’injection d’environnement/clé API `skills.entries.*`. Les autres backends CLI utilisent uniquement le
catalogue de prompts.

## Instantanés et actualisation

OpenClaw prend un instantané des compétences éligibles **au démarrage d’une session** et
réutilise cette liste pour les tours suivants dans la même session. Les modifications de
compétences ou de configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent s’actualiser en cours de session dans deux cas :

- L’observateur de compétences est activé.
- Un nouveau nœud distant éligible apparaît.

Considérez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au
tour d’agent suivant. Si la liste d’autorisation effective des compétences de l’agent change pour cette
session, OpenClaw actualise l’instantané afin que les compétences visibles restent alignées
sur l’agent actuel.

### Observateur de compétences

Par défaut, OpenClaw surveille les dossiers de compétences et incrémente l’instantané des compétences
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

Si le Gateway s’exécute sur Linux mais qu’un **nœud macOS** est connecté avec
`system.run` autorisé (la sécurité des approbations Exec n’est pas définie sur `deny`),
OpenClaw peut considérer les compétences propres à macOS comme éligibles lorsque les
binaires requis sont présents sur ce nœud. L’agent doit exécuter ces compétences
via l’outil `exec` avec `host=node`.

Cela repose sur le signalement par le nœud de sa prise en charge des commandes et sur une sonde de binaire
via `system.which` ou `system.run`. Les nœuds hors ligne ne rendent **pas**
les compétences uniquement distantes visibles. Si un nœud connecté cesse de répondre aux sondes de
binaires, OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
les compétences qui ne peuvent pas actuellement s’y exécuter.

## Impact sur les jetons

Lorsque des compétences sont éligibles, OpenClaw injecte une liste XML compacte des
compétences disponibles dans le prompt système (via `formatSkillsForPrompt` dans
`pi-coding-agent`). Le coût est déterministe :

- **Surcoût de base** (uniquement lorsqu’il y a ≥1 compétence) : 195 caractères.
- **Par compétence :** 97 caractères + la longueur des valeurs `<name>`, `<description>` et `<location>` échappées en XML.

Formule (caractères) :

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.),
ce qui augmente la longueur. Le nombre de jetons varie selon le tokenizer du modèle. Une estimation
approximative de style OpenAI est d’environ 4 caractères/jeton, donc **97 caractères ≈ 24 jetons** par
compétence, plus les longueurs réelles de vos champs.

## Cycle de vie des compétences gérées

OpenClaw fournit un ensemble de base de compétences sous forme de **compétences groupées** avec
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour
les surcharges locales - par exemple, épingler ou corriger une compétence sans
modifier la copie groupée. Les compétences de l’espace de travail appartiennent à l’utilisateur et remplacent
les deux en cas de conflit de noms.

## Vous cherchez plus de compétences ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Configuration des Skills](/fr/tools/skills-config).

## Connexe

- [ClawHub](/fr/tools/clawhub) - registre public de compétences
- [Création de compétences](/fr/tools/creating-skills) - création de compétences personnalisées
- [Plugins](/fr/tools/plugin) - aperçu du système de plugins
- [Plugin Skill Workshop](/fr/plugins/skill-workshop) - générer des compétences à partir du travail d’agent
- [Configuration des Skills](/fr/tools/skills-config) - référence de configuration des compétences
- [Commandes slash](/fr/tools/slash-commands) - toutes les commandes slash disponibles
