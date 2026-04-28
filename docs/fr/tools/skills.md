---
read_when:
    - Ajout ou modification de Skills
    - Modification du filtrage, des listes d'autorisation ou des règles de chargement des Skills
    - Comprendre la priorité des Skills et le comportement des instantanés
sidebarTitle: Skills
summary: 'Skills : gérés vs espace de travail, règles de filtrage, listes d''autorisation d''agents et câblage de configuration'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:40:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw utilise des dossiers de Skills **compatibles [AgentSkills](https://agentskills.io)** pour apprendre à l'agent à utiliser les outils. Chaque skill est un répertoire
contenant un `SKILL.md` avec un frontmatter YAML et des instructions. OpenClaw
charge les Skills groupés ainsi que des surcharges locales facultatives, puis les filtre au
chargement selon l'environnement, la configuration et la présence de binaires.

## Emplacements et priorité

OpenClaw charge les Skills depuis ces sources, **par ordre de priorité décroissante** :

| #   | Source                | Chemin                           |
| --- | --------------------- | -------------------------------- |
| 1   | Skills d'espace de travail | `<workspace>/skills`        |
| 2   | Skills d'agent du projet   | `<workspace>/.agents/skills` |
| 3   | Skills d'agent personnels  | `~/.agents/skills`          |
| 4   | Skills gérés/locaux        | `~/.openclaw/skills`        |
| 5   | Skills groupés             | fournis avec l'installation |
| 6   | Dossiers de Skills supplémentaires | `skills.load.extraDirs` (config) |

Si un nom de skill est en conflit, la source la plus prioritaire l'emporte.

## Skills par agent vs partagés

Dans les configurations **multi-agents**, chaque agent possède son propre espace de travail :

| Portée               | Chemin                                      | Visible pour                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Par agent            | `<workspace>/skills`                        | Cet agent uniquement        |
| Agent du projet      | `<workspace>/.agents/skills`                | Uniquement l'agent de cet espace de travail |
| Agent personnel      | `~/.agents/skills`                          | Tous les agents sur cette machine |
| Gérés/locaux partagés | `~/.openclaw/skills`                       | Tous les agents sur cette machine |
| Répertoires supplémentaires partagés | `skills.load.extraDirs` (priorité la plus basse) | Tous les agents sur cette machine |

Même nom à plusieurs endroits → la source la plus prioritaire l'emporte. L'espace de travail l'emporte sur
l'agent du projet, qui l'emporte sur l'agent personnel, qui l'emporte sur géré/local, qui l'emporte sur groupé,
qui l'emporte sur les répertoires supplémentaires.

## Listes d'autorisation de Skills par agent

L'**emplacement** d'un skill et sa **visibilité** sont deux contrôles distincts.
L'emplacement/la priorité décide quelle copie d'un skill portant le même nom l'emporte ; les listes
d'autorisation d'agent décident quels Skills un agent peut réellement utiliser.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hérite de github, weather
      { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
      { id: "locked-down", skills: [] }, // aucun Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Règles de liste d'autorisation">
    - Omettez `agents.defaults.skills` pour autoriser les Skills sans restriction par défaut.
    - Omettez `agents.list[].skills` pour hériter de `agents.defaults.skills`.
    - Définissez `agents.list[].skills: []` pour n'autoriser aucun Skills.
    - Une liste `agents.list[].skills` non vide est l'ensemble **final** pour cet
      agent — elle ne se fusionne pas avec les valeurs par défaut.
    - La liste d'autorisation effective s'applique à la construction de l'invite, à la
      découverte des commandes slash de Skills, à la synchronisation du bac à sable et aux instantanés de Skills.
  </Accordion>
</AccordionGroup>

## Plugins et Skills

Les plugins peuvent fournir leurs propres Skills en listant des répertoires `skills` dans
`openclaw.plugin.json` (chemins relatifs à la racine du plugin). Les Skills de plugin
sont chargés lorsque le plugin est activé. C'est le bon endroit pour les guides d'utilisation
spécifiques à un outil qui sont trop longs pour la description de l'outil mais qui doivent être
disponibles dès que le plugin est installé — par exemple, le plugin navigateur
fournit un skill `browser-automation` pour le contrôle du navigateur en plusieurs étapes.

Les répertoires de Skills de plugin sont fusionnés dans le même chemin de faible priorité que
`skills.load.extraDirs`, de sorte qu'un skill groupé, géré, d'agent ou d'espace de travail de même nom les surcharge. Vous pouvez les filtrer via
`metadata.openclaw.requires.config` sur l'entrée de configuration du plugin.

Voir [Plugins](/fr/tools/plugin) pour la découverte/la configuration et [Tools](/fr/tools) pour
la surface d'outil qu'enseignent ces Skills.

## Skill Workshop

Le plugin facultatif et expérimental **Skill Workshop** peut créer ou mettre à jour
des Skills d'espace de travail à partir de procédures réutilisables observées pendant le travail de l'agent. Il
est désactivé par défaut et doit être explicitement activé via
`plugins.entries.skill-workshop`.

Skill Workshop écrit uniquement dans `<workspace>/skills`, analyse le
contenu généré, prend en charge l'approbation en attente ou les écritures automatiques sûres, place
en quarantaine les propositions non sûres et actualise l'instantané des Skills après les écritures réussies
afin que les nouveaux Skills deviennent disponibles sans redémarrage du Gateway.

Utilisez-le pour des corrections telles que _« la prochaine fois, vérifie l'attribution GIF »_ ou
pour des workflows durement acquis comme des check-lists QA média. Commencez par l'approbation
en attente ; n'utilisez les écritures automatiques que dans des espaces de travail de confiance après examen
de ses propositions. Guide complet : [plugin Skill Workshop](/fr/plugins/skill-workshop).

## ClawHub (installation et synchronisation)

[ClawHub](https://clawhub.ai) est le registre public des Skills pour OpenClaw.
Utilisez les commandes natives `openclaw skills` pour découvrir/installer/mettre à jour, ou le
CLI séparé `clawhub` pour les workflows de publication/synchronisation. Guide complet :
[ClawHub](/fr/tools/clawhub).

| Action                             | Commande                              |
| ---------------------------------- | ------------------------------------- |
| Installer un skill dans l'espace de travail | `openclaw skills install <skill-slug>` |
| Mettre à jour tous les Skills installés     | `openclaw skills update --all`        |
| Synchroniser (analyser + publier les mises à jour) | `clawhub sync --all`          |

La commande native `openclaw skills install` installe dans le répertoire actif
`skills/` de l'espace de travail. Le CLI séparé `clawhub` installe aussi dans
`./skills` sous votre répertoire de travail actuel (ou revient à
l'espace de travail OpenClaw configuré). OpenClaw le récupère alors comme
`<workspace>/skills` à la session suivante.

## Sécurité

<Warning>
Considérez les Skills tiers comme du **code non fiable**. Lisez-les avant de les activer.
Préférez des exécutions en bac à sable pour les entrées non fiables et les outils à risque. Voir
[Sandboxing](/fr/gateway/sandboxing) pour les contrôles côté agent.
</Warning>

- La découverte des Skills d'espace de travail et de répertoires supplémentaires n'accepte que les racines de skill et les fichiers `SKILL.md` dont le realpath résolu reste dans la racine configurée.
- Les installations de dépendances de Skills pilotées par Gateway (`skills.install`, onboarding et l'interface de paramètres Skills) exécutent l'analyseur intégré de code dangereux avant d'exécuter les métadonnées d'installation. Les résultats `critical` bloquent par défaut à moins que l'appelant ne définisse explicitement la surcharge dangereuse ; les résultats suspects n'émettent encore qu'un avertissement.
- `openclaw skills install <slug>` est différent — il télécharge un dossier de skill ClawHub dans l'espace de travail et n'utilise pas le chemin de métadonnées d'installation ci-dessus.
- `skills.entries.*.env` et `skills.entries.*.apiKey` injectent des secrets dans le processus **hôte** pour ce tour d'agent (pas dans le bac à sable). Gardez les secrets hors des invites et des journaux.

Pour un modèle de menace plus large et des check-lists, voir [Security](/fr/gateway/security).

## Format SKILL.md

`SKILL.md` doit inclure au minimum :

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw suit la spécification AgentSkills pour la mise en page/l'intention. L'analyseur utilisé
par l'agent intégré prend en charge uniquement les clés de frontmatter **sur une seule ligne** ;
`metadata` doit être un **objet JSON sur une seule ligne**. Utilisez `{baseDir}` dans
les instructions pour faire référence au chemin du dossier du skill.

### Clés de frontmatter facultatives

<ParamField path="homepage" type="string">
  URL affichée comme « Website » dans l'interface macOS Skills. Également prise en charge via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Lorsque `true`, le skill est exposé comme commande slash utilisateur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Lorsque `true`, le skill est exclu de l'invite du modèle (reste disponible via invocation utilisateur).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Lorsqu'il est défini sur `tool`, la commande slash contourne le modèle et est envoyée directement à un outil.
</ParamField>
<ParamField path="command-tool" type="string">
  Nom de l'outil à invoquer lorsque `command-dispatch: tool` est défini.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Pour l'envoi à un outil, transmet la chaîne d'arguments brute à l'outil (sans analyse par le cœur). L'outil est invoqué avec `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Filtrage (filtres au chargement)

OpenClaw filtre les Skills au chargement à l'aide de `metadata` (JSON sur une seule ligne) :

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
  Lorsque `true`, inclut toujours le skill (ignore les autres filtres).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji facultatif utilisé par l'interface macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL facultative affichée comme « Website » dans l'interface macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Liste facultative de plateformes. Si elle est définie, le skill n'est éligible que sur ces OS.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Chacun doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Au moins un doit exister sur `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  La variable d'environnement doit exister ou être fournie dans la configuration.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste de chemins `openclaw.json` qui doivent être truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nom de variable d'environnement associé à `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Spécifications d'installation facultatives utilisées par l'interface macOS Skills (brew/node/go/uv/download).
</ParamField>

Si aucun `metadata.openclaw` n'est présent, le skill est toujours éligible (sauf
s'il est désactivé dans la configuration ou bloqué par `skills.allowBundled` pour les Skills groupés).

<Note>
Les blocs hérités `metadata.clawdbot` sont toujours acceptés lorsque
`metadata.openclaw` est absent, afin que les anciens Skills installés conservent leurs
filtres de dépendances et indications d'installation. Les Skills nouveaux ou mis à jour doivent utiliser
`metadata.openclaw`.
</Note>

### Remarques sur le bac à sable

- `requires.bins` est vérifié sur l'**hôte** au chargement du skill.
- Si un agent est isolé en bac à sable, le binaire doit également exister **dans le conteneur**. Installez-le via `agents.defaults.sandbox.docker.setupCommand` (ou une image personnalisée). `setupCommand` s'exécute une fois après la création du conteneur. Les installations de paquets nécessitent aussi une sortie réseau, un système de fichiers racine inscriptible et un utilisateur root dans le bac à sable.
- Exemple : le skill `summarize` (`skills/summarize/SKILL.md`) a besoin du CLI `summarize` dans le conteneur de bac à sable pour y fonctionner.

### Spécifications d'installation

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
  <Accordion title="Règles de sélection de l'installateur">
    - Si plusieurs installateurs sont listés, le gateway choisit une seule option préférée (brew lorsqu'il est disponible, sinon node).
    - Si tous les installateurs sont de type `download`, OpenClaw liste chaque entrée afin que vous puissiez voir les artefacts disponibles.
    - Les spécifications d'installateur peuvent inclure `os: ["darwin"|"linux"|"win32"]` pour filtrer les options par plateforme.
    - Les installations node respectent `skills.install.nodeManager` dans `openclaw.json` (par défaut : npm ; options : npm/pnpm/yarn/bun). Cela n'affecte que les installations de Skills ; l'exécution du Gateway doit toujours être sous Node — Bun n'est pas recommandé pour WhatsApp/Telegram.
    - La sélection d'installateur pilotée par Gateway est guidée par les préférences : lorsque les spécifications d'installation mélangent plusieurs types, OpenClaw préfère Homebrew lorsque `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire node configuré, puis d'autres solutions de repli comme `go` ou `download`.
    - Si toutes les spécifications d'installation sont de type `download`, OpenClaw affiche toutes les options de téléchargement au lieu de les réduire à un seul installateur préféré.

  </Accordion>
  <Accordion title="Détails par installateur">
    - **Installations Go :** si `go` est absent et que `brew` est disponible, le gateway installe d'abord Go via Homebrew et définit `GOBIN` sur le répertoire `bin` de Homebrew lorsque c'est possible.
    - **Installations par téléchargement :** `url` (obligatoire), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (par défaut : automatique lorsqu'une archive est détectée), `stripComponents`, `targetDir` (par défaut : `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Surcharges de configuration

Les Skills groupés et gérés peuvent être activés/désactivés et recevoir des valeurs d'environnement
sous `skills.entries` dans `~/.openclaw/openclaw.json` :

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

<ParamField path="enabled" type="boolean">
  `false` désactive le skill même s'il est groupé ou installé.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Raccourci pour les Skills qui déclarent `metadata.openclaw.primaryEnv`. Prend en charge le texte en clair ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injecté uniquement si la variable n'est pas déjà définie dans le processus.
</ParamField>
<ParamField path="config" type="object">
  Conteneur facultatif pour des champs personnalisés par skill. Les clés personnalisées doivent se trouver ici.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Liste d'autorisation facultative pour les Skills **groupés** uniquement. Si elle est définie, seuls les Skills groupés présents dans la liste sont éligibles (les Skills gérés/d'espace de travail ne sont pas affectés).
</ParamField>

Si le nom du skill contient des traits d'union, mettez la clé entre guillemets (JSON5 autorise les
clés entre guillemets). Les clés de configuration correspondent au **nom du skill** par défaut — si un skill
définit `metadata.openclaw.skillKey`, utilisez cette clé sous `skills.entries`.

<Note>
Pour la génération/modification d'images standard dans OpenClaw, utilisez l'outil central
`image_generate` avec `agents.defaults.imageGenerationModel` à la place
d'un skill groupé. Les exemples de Skills ici concernent des workflows personnalisés ou tiers.
Pour l'analyse d'image native, utilisez l'outil `image` avec
`agents.defaults.imageModel`. Si vous choisissez `openai/*`, `google/*`,
`fal/*` ou un autre modèle d'image spécifique à un fournisseur, ajoutez aussi
l'authentification/la clé API de ce fournisseur.
</Note>

## Injection d'environnement

Lorsqu'une exécution d'agent démarre, OpenClaw :

1. Lit les métadonnées du skill.
2. Applique `skills.entries.<key>.env` et `skills.entries.<key>.apiKey` à `process.env`.
3. Construit l'invite système avec les Skills **éligibles**.
4. Restaure l'environnement d'origine après la fin de l'exécution.

L'injection d'environnement est **limitée à l'exécution de l'agent**, pas à un environnement shell global.

Pour le backend groupé `claude-cli`, OpenClaw matérialise aussi le même
instantané éligible sous forme de plugin Claude Code temporaire et le transmet avec
`--plugin-dir`. Claude Code peut alors utiliser son résolveur natif de Skills tandis
qu'OpenClaw conserve la responsabilité de la priorité, des listes d'autorisation par agent, du filtrage, et de l'injection d'env/clé API `skills.entries.*`.
Les autres backends CLI utilisent uniquement le catalogue d'invites.

## Instantanés et actualisation

OpenClaw capture un instantané des Skills éligibles **au démarrage d'une session** et
réutilise cette liste pour les tours suivants dans la même session. Les modifications apportées
aux Skills ou à la configuration prennent effet à la prochaine nouvelle session.

Les Skills peuvent s'actualiser en cours de session dans deux cas :

- Le watcher de Skills est activé.
- Un nouveau Node distant éligible apparaît.

Voyez cela comme un **rechargement à chaud** : la liste actualisée est prise en compte au
tour d'agent suivant. Si la liste d'autorisation effective des Skills de l'agent change pour cette
session, OpenClaw actualise l'instantané afin que les Skills visibles restent alignés
sur l'agent actuel.

### Watcher de Skills

Par défaut, OpenClaw surveille les dossiers de Skills et incrémente l'instantané des Skills
lorsque des fichiers `SKILL.md` changent. Configurez cela sous `skills.load` :

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

### Nodes macOS distants (Gateway Linux)

Si le Gateway s'exécute sous Linux mais qu'un **Node macOS** est connecté avec
`system.run` autorisé (la sécurité d'approbation Exec n'est pas définie sur `deny`),
OpenClaw peut considérer les Skills réservés à macOS comme éligibles lorsque les
binaires requis sont présents sur ce node. L'agent doit exécuter ces Skills
via l'outil `exec` avec `host=node`.

Cela repose sur le fait que le node signale sa prise en charge des commandes et sur une sonde de binaires
via `system.which` ou `system.run`. Les nodes hors ligne ne rendent **pas**
visibles les Skills disponibles uniquement à distance. Si un node connecté cesse de répondre aux
sondes de binaires, OpenClaw efface ses correspondances de binaires mises en cache afin que les agents ne voient plus
les Skills qui ne peuvent actuellement pas y être exécutés.

## Impact sur les jetons

Lorsque des Skills sont éligibles, OpenClaw injecte une liste XML compacte des
Skills disponibles dans l'invite système (via `formatSkillsForPrompt` dans
`pi-coding-agent`). Le coût est déterministe :

- **Surcharge de base** (uniquement lorsqu'il y a ≥1 skill) : 195 caractères.
- **Par skill :** 97 caractères + la longueur des valeurs XML échappées de `<name>`, `<description>` et `<location>`.

Formule (caractères) :

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

L'échappement XML transforme `& < > " '` en entités (`&amp;`, `&lt;`, etc.),
augmentant la longueur. Le nombre de jetons varie selon le tokenizer du modèle. Une estimation
grossière de style OpenAI est d'environ 4 caractères/jeton, donc **97 caractères ≈ 24 jetons** par
skill plus la longueur réelle de vos champs.

## Cycle de vie des Skills gérés

OpenClaw fournit un ensemble de base de Skills comme **Skills groupés** avec l'installation
(paquet npm ou OpenClaw.app). `~/.openclaw/skills` existe pour
les surcharges locales — par exemple, épingler ou corriger un skill sans
modifier la copie groupée. Les Skills d'espace de travail appartiennent à l'utilisateur et surchargent
les deux en cas de conflit de nom.

## Vous cherchez plus de Skills ?

Parcourez [https://clawhub.ai](https://clawhub.ai). Schéma de configuration complet :
[Skills config](/fr/tools/skills-config).

## Lié

- [ClawHub](/fr/tools/clawhub) — registre public de Skills
- [Creating skills](/fr/tools/creating-skills) — création de Skills personnalisés
- [Plugins](/fr/tools/plugin) — vue d'ensemble du système de plugins
- [Skill Workshop plugin](/fr/plugins/skill-workshop) — générer des Skills à partir du travail de l'agent
- [Skills config](/fr/tools/skills-config) — référence de configuration des Skills
- [Slash commands](/fr/tools/slash-commands) — toutes les commandes slash disponibles
