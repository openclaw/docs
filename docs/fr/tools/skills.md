---
read_when:
    - Ajout ou modification de Skills
    - Modification des règles de contrôle ou de chargement des Skills
summary: 'Skills : gérés vs espace de travail, règles de contrôle, et câblage config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw utilise des dossiers de Skills **compatibles avec [AgentSkills](https://agentskills.io)** pour apprendre à l’agent à utiliser les outils. Chaque Skill est un répertoire contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw charge les **Skills fournis avec OpenClaw** ainsi que des remplacements locaux facultatifs, puis les filtre au moment du chargement selon l’environnement, la configuration et la présence de binaires.

## Emplacements et priorité

OpenClaw charge les Skills depuis les sources suivantes :

1. **Dossiers de Skills supplémentaires** : configurés avec `skills.load.extraDirs`
2. **Skills fournis avec OpenClaw** : livrés avec l’installation (package npm ou OpenClaw.app)
3. **Skills gérés/locaux** : `~/.openclaw/skills`
4. **Skills d’agent personnels** : `~/.agents/skills`
5. **Skills d’agent du projet** : `<workspace>/.agents/skills`
6. **Skills de l’espace de travail** : `<workspace>/skills`

En cas de conflit de nom de Skill, l’ordre de priorité est :

`<workspace>/skills` (priorité la plus haute) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills fournis avec OpenClaw → `skills.load.extraDirs` (priorité la plus basse)

## Skills par agent vs Skills partagés

Dans les configurations **multi-agent**, chaque agent possède son propre espace de travail. Cela signifie que :

- Les **Skills par agent** se trouvent dans `<workspace>/skills` pour cet agent uniquement.
- Les **Skills d’agent du projet** se trouvent dans `<workspace>/.agents/skills` et s’appliquent à
  cet espace de travail avant le dossier normal `skills/` de l’espace de travail.
- Les **Skills d’agent personnels** se trouvent dans `~/.agents/skills` et s’appliquent à tous les
  espaces de travail de cette machine.
- Les **Skills partagés** se trouvent dans `~/.openclaw/skills` (gérés/locaux) et sont visibles
  par **tous les agents** de la même machine.
- Des **dossiers partagés** peuvent aussi être ajoutés via `skills.load.extraDirs` (priorité la plus faible)
  si vous voulez un pack commun de Skills utilisé par plusieurs agents.

Si le même nom de Skill existe à plusieurs endroits, l’ordre de priorité habituel
s’applique : l’espace de travail gagne, puis les Skills d’agent du projet, puis les Skills d’agent personnels,
puis les Skills gérés/locaux, puis les Skills fournis avec OpenClaw, puis les dossiers supplémentaires.

## Listes d’autorisation de Skills par agent

L’**emplacement** d’un Skill et sa **visibilité** sont deux contrôles distincts.

- L’emplacement/la priorité décide quelle copie d’un Skill portant le même nom l’emporte.
- Les listes d’autorisation d’agent décident quels Skills visibles un agent peut réellement utiliser.

Utilisez `agents.defaults.skills` pour une base partagée, puis remplacez par agent avec
`agents.list[].skills` :

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

Règles :

- Omettez `agents.defaults.skills` pour des Skills non restreints par défaut.
- Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
- Définissez `agents.list[].skills: []` pour n’avoir aucun Skill.
- Une liste non vide `agents.list[].skills` constitue l’ensemble final pour cet agent ; elle
  ne fusionne pas avec les valeurs par défaut.

OpenClaw applique l’ensemble effectif de Skills de l’agent à la construction du prompt, à la
découverte des commandes slash des Skills, à la synchronisation sandbox et aux instantanés de Skills.

## Plugins + Skills

Les Plugins peuvent livrer leurs propres Skills en déclarant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du Plugin). Les Skills de Plugin sont chargés
lorsque le Plugin est activé. C’est le bon endroit pour des guides d’utilisation spécifiques à un outil,
trop longs pour la description de l’outil mais devant être disponibles
chaque fois que le Plugin est installé ; par exemple, le Plugin browser livre un
Skill `browser-automation` pour le contrôle du navigateur en plusieurs étapes. Aujourd’hui, ces
répertoires sont fusionnés dans le même chemin à faible priorité que
`skills.load.extraDirs`, de sorte qu’un Skill du même nom fourni avec OpenClaw, géré, d’agent ou d’espace de travail
les remplace.
Vous pouvez les contrôler via `metadata.openclaw.requires.config` sur l’entrée de configuration du Plugin.
Voir [Plugins](/fr/tools/plugin) pour la découverte/configuration et [Tools](/fr/tools) pour la
surface des outils que ces Skills enseignent.

## Skill Workshop

Le Plugin Skill Workshop, optionnel et expérimental, peut créer ou mettre à jour des
Skills d’espace de travail à partir de procédures réutilisables observées pendant le travail de l’agent. Il est désactivé par
défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le contenu généré,
prend en charge l’approbation en attente ou les écritures automatiques sûres, met en quarantaine les
propositions non sûres, et actualise l’instantané des Skills après des écritures réussies afin que les nouveaux
Skills puissent devenir disponibles sans redémarrage du Gateway.

Utilisez-le lorsque vous souhaitez que des corrections comme « la prochaine fois, vérifie l’attribution du GIF » ou
des workflows durement acquis comme des checklists QA média deviennent des instructions procédurales
durables. Commencez par l’approbation en attente ; n’utilisez les écritures automatiques que dans des
espaces de travail de confiance après examen de ses propositions. Guide complet :
[Plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation + synchronisation)

ClawHub est le registre public de Skills pour OpenClaw. Parcourez-le sur
[https://clawhub.ai](https://clawhub.ai). Utilisez les commandes natives `openclaw skills`
pour découvrir/installer/mettre à jour des Skills, ou le CLI séparé `clawhub` lorsque
vous avez besoin de workflows de publication/synchronisation.
Guide complet : [ClawHub](/fr/tools/clawhub).

Flux courants :

- Installer un Skill dans votre espace de travail :
  - `openclaw skills install <skill-slug>`
- Mettre à jour tous les Skills installés :
  - `openclaw skills update --all`
- Synchroniser (analyse + publication des mises à jour) :
  - `clawhub sync --all`

La commande native `openclaw skills install` installe dans le répertoire `skills/`
de l’espace de travail actif. Le CLI séparé `clawhub` installe aussi dans `./skills` sous votre
répertoire de travail courant (ou revient à l’espace de travail OpenClaw configuré).
OpenClaw le récupère alors comme `<workspace>/skills` à la session suivante.

## Notes de sécurité

- Considérez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
- Préférez des exécutions en sandbox pour les entrées non fiables et les outils à risque. Voir [Sandboxing](/fr/gateway/sandboxing).
- La découverte de Skills dans l’espace de travail et les dossiers supplémentaires n’accepte que les racines de Skills et les fichiers `SKILL.md` dont le realpath résolu reste à l’intérieur de la racine configurée.
- Les installations de dépendances de Skills prises en charge par le Gateway (`skills.install`, onboarding et l’interface des paramètres Skills) exécutent le scanner intégré de code dangereux avant d’exécuter les métadonnées d’installation. Les résultats `critical` bloquent par défaut, sauf si l’appelant définit explicitement le remplacement dangereux ; les résultats suspects restent de simples avertissements.
- `openclaw skills install <slug>` est différent : il télécharge un dossier de Skill ClawHub dans l’espace de travail et n’utilise pas le chemin des métadonnées d’installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent les secrets dans le processus **hôte**
  pour ce tour d’agent (pas dans la sandbox). Gardez les secrets hors des prompts et des journaux.
- Pour un modèle de menace plus large et des checklists, voir [Security](/fr/gateway/security).

## Format (compatible AgentSkills + Pi)

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Remarques :

- Nous suivons la spécification AgentSkills pour la disposition/l’intention.
- Le parseur utilisé par l’agent embarqué ne prend en charge que des clés de frontmatter **sur une seule ligne**.
- `metadata` doit être un **objet JSON sur une seule ligne**.
- Utilisez `{baseDir}` dans les instructions pour référencer le chemin du dossier du Skill.
- Clés de frontmatter facultatives :
  - `homepage` — URL affichée comme « Website » dans l’interface macOS Skills (également prise en charge via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (par défaut : `true`). Lorsque `true`, le Skill est exposé comme commande slash utilisateur.
  - `disable-model-invocation` — `true|false` (par défaut : `false`). Lorsque `true`, le Skill est exclu du prompt du modèle (mais reste disponible via invocation utilisateur).
  - `command-dispatch` — `tool` (facultatif). Lorsqu’il est défini à `tool`, la commande slash contourne le modèle et distribue directement vers un outil.
  - `command-tool` — nom de l’outil à invoquer lorsque `command-dispatch: tool` est défini.
  - `command-arg-mode` — `raw` (par défaut). Pour la distribution vers un outil, transmet la chaîne brute des arguments à l’outil (sans analyse par le cœur).

    L’outil est invoqué avec les paramètres :
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Contrôle (filtres au chargement)

OpenClaw **filtre les Skills au moment du chargement** à l’aide de `metadata` (JSON sur une seule ligne) :

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

Champs sous `metadata.openclaw` :

- `always: true` — inclut toujours le Skill (ignore les autres contrôles).
- `emoji` — emoji facultatif utilisé par l’interface macOS Skills.
- `homepage` — URL facultative affichée comme « Website » dans l’interface macOS Skills.
- `os` — liste facultative de plateformes (`darwin`, `linux`, `win32`). Si définie, le Skill n’est admissible que sur ces OS.
- `requires.bins` — liste ; chacun doit exister dans `PATH`.
- `requires.anyBins` — liste ; au moins un doit exister dans `PATH`.
- `requires.env` — liste ; la variable d’environnement doit exister **ou** être fournie dans la configuration.
- `requires.config` — liste de chemins `openclaw.json` qui doivent être truthy.
- `primaryEnv` — nom de variable d’environnement associé à `skills.entries.<name>.apiKey`.
- `install` — tableau facultatif de spécifications d’installation utilisé par l’interface macOS Skills (brew/node/go/uv/download).

Les blocs hérités `metadata.clawdbot` sont encore acceptés lorsque
`metadata.openclaw` est absent, afin que les anciens Skills installés conservent leurs
contrôles de dépendance et indices d’installation. Les Skills nouveaux et mis à jour doivent utiliser
`metadata.openclaw`.

Remarque sur la sandbox :

- `requires.bins` est vérifié sur l’**hôte** au moment du chargement du Skill.
- Si un agent est sandboxé, le binaire doit aussi exister **dans le conteneur**.
  Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée).
  `setupCommand` s’exécute une fois après la création du conteneur.
  Les installations de packages exigent aussi une sortie réseau, un système de fichiers racine inscriptible et un utilisateur root dans la sandbox.
  Exemple : le Skill `summarize` (`skills/summarize/SKILL.md`) a besoin du CLI `summarize`
  dans le conteneur sandbox pour pouvoir s’y exécuter.

Exemple d’installateur :

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

Remarques :

- Si plusieurs installateurs sont listés, le Gateway choisit une **seule** option préférée (brew lorsqu’il est disponible, sinon node).
- Si tous les installateurs sont de type `download`, OpenClaw affiche chaque entrée afin que vous puissiez voir les artefacts disponibles.
- Les spécifications d’installation peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
- Les installations node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun).
  Cela n’affecte que les **installations de Skills** ; le runtime Gateway doit toujours être Node
  (Bun n’est pas recommandé pour WhatsApp/Telegram).
- La sélection d’installateur prise en charge par le Gateway est pilotée par les préférences, pas uniquement par node :
  lorsque les spécifications d’installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le
  gestionnaire node configuré, puis d’autres solutions de repli comme `go` ou `download`.
- Si toutes les spécifications d’installation sont de type `download`, OpenClaw affiche toutes les options de téléchargement
  au lieu de les réduire à un seul installateur préféré.
- Installations Go : si `go` est absent et que `brew` est disponible, le Gateway installe d’abord Go via Homebrew puis définit `GOBIN` sur le `bin` de Homebrew lorsque c’est possible.
- Installations par téléchargement : `url` (requis), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : automatique lorsqu’une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

Si `metadata.openclaw` n’est pas présent, le Skill est toujours admissible (sauf
s’il est désactivé dans la configuration ou bloqué par `skills.allowBundled` pour les Skills fournis avec OpenClaw).

## Remplacements de configuration (`~/.openclaw/openclaw.json`)

Les Skills fournis avec OpenClaw/gérés peuvent être activés ou désactivés et recevoir des valeurs d’environnement :

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

Remarque : si le nom du Skill contient des tirets, mettez la clé entre guillemets (JSON5 autorise les clés entre guillemets).

Si vous souhaitez disposer de la génération/édition d’images native dans OpenClaw lui-même, utilisez l’outil central
`image_generate` avec `agents.defaults.imageGenerationModel` au lieu d’un
Skill fourni avec OpenClaw. Les exemples de Skills ici concernent des workflows personnalisés ou tiers.

Pour l’analyse d’images native, utilisez l’outil `image` avec `agents.defaults.imageModel`.
Pour la génération/édition d’images native, utilisez `image_generate` avec
`agents.defaults.imageGenerationModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*`, ou un autre modèle d’image spécifique à un fournisseur, ajoutez aussi
l’authentification/la clé API de ce fournisseur.

Les clés de configuration correspondent par défaut au **nom du Skill**. Si un Skill définit
`metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

Règles :

- `enabled: false` désactive le Skill même s’il est fourni avec OpenClaw/installé.
- `env` : injecté **uniquement si** la variable n’est pas déjà définie dans le processus.
- `apiKey` : raccourci pratique pour les Skills qui déclarent `metadata.openclaw.primaryEnv`.
  Prend en charge une chaîne en clair ou un objet SecretRef (`{ source, provider, id }`).
- `config` : conteneur facultatif pour des champs personnalisés par Skill ; les clés personnalisées doivent se trouver ici.
- `allowBundled` : liste d’autorisation facultative pour les **Skills fournis avec OpenClaw** uniquement. Si elle est définie, seuls
  les Skills fournis avec OpenClaw présents dans la liste sont admissibles (les Skills gérés/de l’espace de travail ne sont pas affectés).

## Injection d’environnement (par exécution d’agent)

Lorsqu’une exécution d’agent démarre, OpenClaw :

1. lit les métadonnées des Skills.
2. applique tout `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` à
   `process.env`.
3. construit le prompt système avec les Skills **admissibles**.
4. restaure l’environnement d’origine une fois l’exécution terminée.

Cela est **limité à l’exécution de l’agent**, pas à un environnement shell global.

Pour le backend `claude-cli` fourni avec OpenClaw, OpenClaw matérialise aussi le même
instantané admissible sous la forme d’un plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur natif de Skills tandis
qu’OpenClaw conserve la maîtrise de la priorité, des listes d’autorisation par agent, du contrôle, et de
l’injection d’env/clés API `skills.entries.*`. Les autres backends CLI utilisent uniquement le catalogue de prompts.

## Instantané de session (performances)

OpenClaw prend un instantané des Skills admissibles **au démarrage d’une session** et réutilise cette liste pour les tours suivants de la même session. Les modifications des Skills ou de la configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent aussi être actualisés en cours de session lorsque le watcher de Skills est activé ou lorsqu’un nouveau Node distant admissible apparaît (voir ci-dessous). Considérez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au tour d’agent suivant.

Si la liste d’autorisation effective des Skills de l’agent change pour cette session, OpenClaw
actualise l’instantané afin que les Skills visibles restent alignés sur l’agent
actuel.

## Nodes macOS distants (Gateway Linux)

Si le Gateway s’exécute sur Linux mais qu’un **Node macOS** est connecté **avec `system.run` autorisé** (sécurité des approbations Exec non définie sur `deny`), OpenClaw peut considérer les Skills réservés à macOS comme admissibles lorsque les binaires requis sont présents sur ce Node. L’agent doit exécuter ces Skills via l’outil `exec` avec `host=node`.

Cela repose sur le fait que le Node signale sa prise en charge des commandes et sur une sonde de binaire via `system.run`. Si le Node macOS se déconnecte ensuite, les Skills restent visibles ; les invocations peuvent échouer jusqu’à la reconnexion du Node.

## Watcher de Skills (actualisation automatique)

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l’instantané des Skills lorsque des fichiers `SKILL.md` changent. Configurez cela sous `skills.load` :

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

## Impact sur les jetons (liste des Skills)

Lorsque des Skills sont admissibles, OpenClaw injecte une liste XML compacte des Skills disponibles dans le prompt système (via `formatSkillsForPrompt` dans `pi-coding-agent`). Le coût est déterministe :

- **Surcharge de base (uniquement lorsqu’il y a ≥1 Skill)** : 195 caractères.
- **Par Skill** : 97 caractères + la longueur des valeurs XML-échappées de `<name>`, `<description>` et `<location>`.

Formule (caractères) :

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Remarques :

- L’échappement XML développe `& < > " '` en entités (`&amp;`, `&lt;`, etc.), ce qui augmente la longueur.
- Le nombre de jetons varie selon le tokenizer du modèle. Une estimation grossière de style OpenAI est d’environ 4 caractères/jeton, donc **97 caractères ≈ 24 jetons** par Skill, plus les longueurs réelles de vos champs.

## Cycle de vie des Skills gérés

OpenClaw livre un ensemble de base de Skills comme **Skills fournis avec OpenClaw** dans
l’installation (package npm ou OpenClaw.app). `~/.openclaw/skills` existe pour des
remplacements locaux (par exemple, épingler/patcher un Skill sans modifier la copie
fournie avec OpenClaw). Les Skills de l’espace de travail appartiennent à l’utilisateur et remplacent les deux en cas de conflit de nom.

## Référence de configuration

Voir [Configuration des Skills](/fr/tools/skills-config) pour le schéma complet de configuration.

## Vous cherchez d’autres Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai).

---

## Lié

- [Création de Skills](/fr/tools/creating-skills) — créer des Skills personnalisés
- [Configuration des Skills](/fr/tools/skills-config) — référence de configuration des Skills
- [Commandes slash](/fr/tools/slash-commands) — toutes les commandes slash disponibles
- [Plugins](/fr/tools/plugin) — vue d’ensemble du système de Plugin
