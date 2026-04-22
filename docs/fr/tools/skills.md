---
read_when:
    - Ajout ou modification de Skills
    - Modification du filtrage des Skills ou des règles de chargement
summary: 'Skills : gérés vs espace de travail, règles de filtrage, et câblage config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:28:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw utilise des dossiers de Skills **compatibles [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser les outils. Chaque Skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les **Skills intégrés** ainsi que des remplacements locaux facultatifs, puis les filtre au moment du chargement selon l’environnement, la configuration et la présence de binaires.

## Emplacements et priorité

OpenClaw charge les Skills depuis ces sources :

1. **Dossiers de Skills supplémentaires** : configurés avec `skills.load.extraDirs`
2. **Skills intégrés** : livrés avec l’installation (package npm ou OpenClaw.app)
3. **Skills gérés/locaux** : `~/.openclaw/skills`
4. **Skills d’agent personnels** : `~/.agents/skills`
5. **Skills d’agent du projet** : `<workspace>/.agents/skills`
6. **Skills d’espace de travail** : `<workspace>/skills`

En cas de conflit de nom de Skill, la priorité est :

`<workspace>/skills` (plus haute) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills intégrés → `skills.load.extraDirs` (plus basse)

## Skills par agent vs partagés

Dans les configurations **multi-agent**, chaque agent a son propre espace de travail. Cela signifie :

- Les **Skills par agent** se trouvent dans `<workspace>/skills` pour cet agent uniquement.
- Les **Skills d’agent du projet** se trouvent dans `<workspace>/.agents/skills` et s’appliquent à
  cet espace de travail avant le dossier normal `skills/` de l’espace de travail.
- Les **Skills d’agent personnels** se trouvent dans `~/.agents/skills` et s’appliquent à tous les
  espaces de travail de cette machine.
- Les **Skills partagés** se trouvent dans `~/.openclaw/skills` (gérés/locaux) et sont visibles
  par **tous les agents** de la même machine.
- Des **dossiers partagés** peuvent aussi être ajoutés via `skills.load.extraDirs` (priorité la plus basse)
  si vous voulez un pack de Skills commun utilisé par plusieurs agents.

Si le même nom de Skill existe à plusieurs endroits, la priorité habituelle
s’applique : l’espace de travail l’emporte, puis les Skills d’agent du projet, puis les Skills d’agent personnels,
puis les Skills gérés/locaux, puis les Skills intégrés, puis les dossiers supplémentaires.

## Listes d’autorisation de Skills par agent

L’**emplacement** d’un Skill et sa **visibilité** sont deux contrôles distincts.

- L’emplacement/la priorité décide quelle copie d’un Skill de même nom l’emporte.
- Les listes d’autorisation d’agent décident quels Skills visibles un agent peut réellement utiliser.

Utilisez `agents.defaults.skills` pour une base commune, puis remplacez par agent avec
`agents.list[].skills` :

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skill
    ],
  },
}
```

Règles :

- Omettez `agents.defaults.skills` pour des Skills non restreints par défaut.
- Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skill.
- Une liste non vide `agents.list[].skills` est l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

OpenClaw applique l’ensemble effectif de Skills de l’agent à la construction du prompt,
à la découverte des commandes slash de Skill, à la synchronisation du sandbox, et aux snapshots de Skills.

## Plugins + Skills

Les Plugins peuvent livrer leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin se chargent
lorsque le Plugin est activé. Aujourd’hui, ces répertoires sont fusionnés dans le même chemin
à faible priorité que `skills.load.extraDirs`, donc un Skill intégré, géré,
d’agent ou d’espace de travail de même nom les remplace.
Vous pouvez les filtrer via `metadata.openclaw.requires.config` sur l’entrée de configuration
du Plugin. Voir [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Tools](/fr/tools) pour la
surface d’outils que ces Skills enseignent.

## Skill Workshop

Le Plugin facultatif et expérimental Skill Workshop peut créer ou mettre à jour des Skills
d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il est désactivé par
défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu généré,
prend en charge l’approbation en attente ou les écritures automatiques sûres, met en quarantaine les
propositions non sûres, et actualise le snapshot des Skills après des écritures réussies afin que de nouveaux
Skills puissent devenir disponibles sans redémarrage de Gateway.

Utilisez-le lorsque vous voulez que des corrections telles que « la prochaine fois, vérifier l’attribution du GIF » ou
des workflows durement acquis tels que des checklists QA média deviennent des instructions procédurales
durables. Commencez avec l’approbation en attente ; utilisez les écritures automatiques uniquement dans des
espaces de travail de confiance après examen de ses propositions. Guide complet :
[Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation + synchronisation)

ClawHub est le registre public de Skills pour OpenClaw. Parcourez-le sur
[https://clawhub.ai](https://clawhub.ai). Utilisez les commandes natives `openclaw skills`
pour découvrir/installer/mettre à jour des Skills, ou le CLI séparé `clawhub` lorsque
vous avez besoin de workflows de publication/synchronisation.
Guide complet : [ClawHub](/fr/tools/clawhub).

Flux courants :

- Installer un Skill dans votre espace de travail :
  - `openclaw skills install <skill-slug>`
- Mettre à jour tous les Skills installés :
  - `openclaw skills update --all`
- Synchroniser (analyser + publier les mises à jour) :
  - `clawhub sync --all`

La commande native `openclaw skills install` installe dans le répertoire actif `skills/` de l’espace de travail. Le
CLI séparé `clawhub` installe aussi dans `./skills` sous votre répertoire de travail
actuel (ou se replie sur l’espace de travail OpenClaw configuré).
OpenClaw le prend en charge comme `<workspace>/skills` à la session suivante.

## Remarques de sécurité

- Traitez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
- Préférez les exécutions sandboxées pour les entrées non fiables et les outils risqués. Voir [Sandboxing](/fr/gateway/sandboxing).
- La découverte des Skills dans l’espace de travail et les dossiers supplémentaires n’accepte que les racines de Skill et les fichiers `SKILL.md` dont le realpath résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de Skill adossées à Gateway (`skills.install`, onboarding, et l’interface de réglages Skills) exécutent le scanner intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut, sauf si l’appelant définit explicitement le remplacement dangereux ; les résultats suspects restent de simples avertissements.
- `openclaw skills install <slug>` est différent : il télécharge un dossier de Skill ClawHub dans l’espace de travail et n’utilise pas le chemin de métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte**
  pour ce tour d’agent (pas dans le sandbox). Gardez les secrets hors des prompts et des journaux.
- Pour un modèle de menace plus large et des checklists, voir [Sécurité](/fr/gateway/security).

## Format (AgentSkills + compatible Pi)

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Remarques :

- Nous suivons la spécification AgentSkills pour la disposition/l’intention.
- Le parseur utilisé par l’agent embarqué prend en charge uniquement des clés de frontmatter **sur une seule ligne**.
- `metadata` doit être un **objet JSON sur une seule ligne**.
- Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier du Skill.
- Clés de frontmatter facultatives :
  - `homepage` — URL affichée comme « Website » dans l’interface Skills de macOS (également prise en charge via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (par défaut : `true`). Lorsque cette valeur est `true`, le Skill est exposé comme commande slash utilisateur.
  - `disable-model-invocation` — `true|false` (par défaut : `false`). Lorsque cette valeur est `true`, le Skill est exclu du prompt du modèle (tout en restant disponible via invocation utilisateur).
  - `command-dispatch` — `tool` (facultatif). Lorsqu’il est défini à `tool`, la commande slash contourne le modèle et se répartit directement vers un outil.
  - `command-tool` — nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
  - `command-arg-mode` — `raw` (par défaut). Pour la répartition vers un outil, transmet la chaîne d’arguments brute à l’outil (sans parsing core).

    L’outil est invoqué avec les paramètres :
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Filtrage (filtres au chargement)

OpenClaw **filtre les Skills au moment du chargement** à l’aide de `metadata` (JSON sur une seule ligne) :

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

- `always: true` — inclut toujours le Skill (ignore les autres filtres).
- `emoji` — emoji facultatif utilisé par l’interface Skills de macOS.
- `homepage` — URL facultative affichée comme « Website » dans l’interface Skills de macOS.
- `os` — liste facultative de plateformes (`darwin`, `linux`, `win32`). Si elle est définie, le Skill n’est éligible que sur ces OS.
- `requires.bins` — liste ; chacun doit exister dans `PATH`.
- `requires.anyBins` — liste ; au moins un doit exister dans `PATH`.
- `requires.env` — liste ; la variable d’environnement doit exister **ou** être fournie dans la configuration.
- `requires.config` — liste de chemins `openclaw.json` qui doivent être truthy.
- `primaryEnv` — nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
- `install` — tableau facultatif de spécifications d’installation utilisé par l’interface Skills de macOS (brew/node/go/uv/download).

Remarque sur le sandboxing :

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement du Skill.
- Si un agent est sandboxé, le binaire doit aussi exister **dans le conteneur**.
  Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée).
  `setupCommand` s’exécute une seule fois après la création du conteneur.
  Les installations de packages nécessitent aussi une sortie réseau, un système de fichiers racine inscriptible, et un utilisateur root dans le sandbox.
  Exemple : le Skill `summarize` (`skills/summarize/SKILL.md`) nécessite le CLI `summarize`
  dans le conteneur sandbox pour y fonctionner.

Exemple d’installation :

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

Remarques :

- Si plusieurs installateurs sont listés, Gateway choisit une **seule** option préférée (brew si disponible, sinon node).
- Si tous les installateurs sont `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
- Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
- Les installations Node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun).
  Cela n’affecte que les **installations de Skill** ; le runtime Gateway doit quand même être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
- La sélection d’installateur adossée à Gateway est guidée par les préférences, et pas limitée à node :
  lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le
  gestionnaire node configuré, puis d’autres replis comme `go` ou `download`.
- Si toutes les spécifications d’installation sont `download`, OpenClaw affiche toutes les options de téléchargement
  au lieu de les réduire à un seul installateur préféré.
- Installations Go : si `go` est absent et que `brew` est disponible, Gateway installe d’abord Go via Homebrew et définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
- Installations par téléchargement : `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : auto lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

Si aucun `metadata.openclaw` n’est présent, le Skill est toujours éligible (sauf
s’il est désactivé dans la configuration ou bloqué par `skills.allowBundled` pour les Skills intégrés).

## Remplacements de configuration (`~/.openclaw/openclaw.json`)

Les Skills intégrés/gérés peuvent être activés/désactivés et recevoir des valeurs d’environnement :

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou chaîne en clair
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

Remarque : si le nom du Skill contient des tirets, mettez la clé entre guillemets (JSON5 autorise les clés entre guillemets).

Si vous voulez une génération/édition d’image standard directement dans OpenClaw, utilisez l’outil core
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu d’un
Skill intégré. Les exemples de Skills ici sont destinés aux workflows personnalisés ou tiers.

Pour l’analyse d’image native, utilisez l’outil `image` avec `agents.defaults.imageModel`.
Pour la génération/édition d’image native, utilisez `image_generate` avec
`agents.defaults.imageGenerationModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*`, ou un autre modèle d’image spécifique à un provider, ajoutez aussi l’auth/la clé API
de ce provider.

Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
`metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

Règles :

- `enabled: false` désactive le Skill même s’il est intégré/installé.
- `env` : injecté **uniquement si** la variable n’est pas déjà définie dans le processus.
- `apiKey` : raccourci pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).
- `config` : conteneur facultatif pour des champs personnalisés par Skill ; les clés personnalisées doivent s’y trouver.
- `allowBundled` : liste d’autorisation facultative pour les **Skills intégrés** uniquement. Si elle est définie, seuls
  les Skills intégrés présents dans la liste sont éligibles (les Skills gérés/d’espace de travail ne sont pas affectés).

## Injection d’environnement (par exécution d’agent)

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. Lit les métadonnées du Skill.
2. Applique tout `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` à
   `process.env`.
3. Construit le prompt système avec les Skills **éligibles**.
4. Restaure l’environnement d’origine après la fin de l’exécution.

Cela est **limité à l’exécution de l’agent**, pas à un environnement shell global.

Pour le backend intégré `claude-cli`, OpenClaw matérialise aussi le même
snapshot éligible sous forme de Plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur de Skill natif tandis
qu’OpenClaw conserve la priorité, les listes d’autorisation par agent, le filtrage, et
l’injection d’environnement/de clé API `skills.entries.*`. Les autres backends CLI utilisent uniquement
le catalogue du prompt.

## Snapshot de session (performances)

OpenClaw capture un snapshot des Skills éligibles **au démarrage d’une session** et réutilise cette liste pour les tours suivants de la même session. Les modifications des Skills ou de la configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent aussi être actualisés en cours de session lorsque le watcher de Skills est activé ou lorsqu’un nouveau Node distant éligible apparaît (voir ci-dessous). Considérez cela comme un **hot reload** : la liste actualisée est prise en compte au prochain tour d’agent.

Si la liste d’autorisation effective de Skills de l’agent change pour cette session, OpenClaw
actualise le snapshot afin que les Skills visibles restent alignés avec l’agent
actuel.

## Nodes macOS distants (Gateway Linux)

Si Gateway s’exécute sur Linux mais qu’un **Node macOS** est connecté **avec `system.run` autorisé** (sécurité des approbations Exec non définie à `deny`), OpenClaw peut considérer les Skills propres à macOS comme éligibles lorsque les binaires requis sont présents sur ce Node. L’agent doit exécuter ces Skills via l’outil `exec` avec `host=node`.

Cela repose sur le fait que le Node signale sa prise en charge des commandes et sur une sonde de bin via `system.run`. Si le Node macOS se déconnecte ensuite, les Skills restent visibles ; les invocations peuvent échouer jusqu’à ce que le Node se reconnecte.

## Watcher de Skills (actualisation automatique)

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente le snapshot des Skills lorsque les fichiers `SKILL.md` changent. Configurez cela sous `skills.load` :

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

## Impact sur les tokens (liste des Skills)

Lorsque des Skills sont éligibles, OpenClaw injecte une liste XML compacte des Skills disponibles dans le prompt système (via `formatSkillsForPrompt` dans `pi-coding-agent`). Le coût est déterministe :

- **Surcharge de base (uniquement quand ≥1 Skill) :** 195 caractères.
- **Par Skill :** 97 caractères + la longueur des valeurs XML-escaped de `<name>`, `<description>`, et `<location>`.

Formule (caractères) :

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Remarques :

- L’échappement XML étend `& < > " '` en entités (`&amp;`, `&lt;`, etc.), augmentant la longueur.
- Le nombre de tokens varie selon le tokenizer du modèle. Une estimation approximative de type OpenAI est d’environ 4 caractères/token, donc **97 caractères ≈ 24 tokens** par Skill, plus les longueurs réelles de vos champs.

## Cycle de vie des Skills gérés

OpenClaw livre un ensemble de base de Skills comme **Skills intégrés** dans
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour des
remplacements locaux (par exemple, épingler/patcher un Skill sans modifier la copie
intégrée). Les Skills d’espace de travail appartiennent à l’utilisateur et remplacent les deux en cas de conflit de nom.

## Référence de configuration

Voir [Config Skills](/fr/tools/skills-config) pour le schéma complet de configuration.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai).

---

## Lié

- [Création de Skills](/fr/tools/creating-skills) — construire des Skills personnalisés
- [Config Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
- [Plugins](/fr/tools/plugin) — vue d’ensemble du système de Plugins
