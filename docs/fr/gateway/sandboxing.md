---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Fonctionnement du sandboxing dans OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw peut exécuter des **outils dans des backends sandbox** afin de réduire le rayon d’impact.
C’est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte.
Le Gateway reste sur l’hôte ; l’exécution des outils se fait dans une sandbox isolée
lorsqu’elle est activée.

Ce n’est pas une limite de sécurité parfaite, mais cela limite matériellement l’accès
au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.

## Ce qui est sandboxé

- Exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur sandboxé facultatif (`agents.defaults.sandbox.browser`).
  - Par défaut, le navigateur sandbox démarre automatiquement (garantit que CDP est joignable) lorsque l’outil navigateur en a besoin.
    Configurez cela via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Par défaut, les conteneurs du navigateur sandbox utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`.
    Configurez cela avec `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` facultatif restreint l’ingress CDP en bordure de conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
  - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL de jeton à courte durée de vie qui sert une page bootstrap locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur de l’hôte.
  - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non sandboxés :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors de la sandbox (par ex. `tools.elevated`).
  - **L’exécution elevated contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Mode Elevated](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

- `"off"` : aucun sandboxing.
- `"non-main"` : sandbox uniquement les sessions **non principales** (par défaut si vous voulez des chats normaux sur l’hôte).
- `"all"` : chaque session s’exécute dans une sandbox.
  Remarque : `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), et non sur l’identifiant d’agent.
  Les sessions de groupe/canal utilisent leurs propres clés, donc elles comptent comme non principales et seront sandboxées.

## Portée

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions sandboxées.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit la sandbox :

- `"docker"` (par défaut lorsque le sandboxing est activé) : runtime sandbox local adossé à Docker.
- `"ssh"` : runtime sandbox distant générique adossé à SSH.
- `"openshell"` : runtime sandbox adossé à OpenShell.

La configuration spécifique à SSH se trouve sous `agents.defaults.sandbox.ssh`.
La configuration spécifique à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où il s’exécute** | Conteneur local                  | Tout hôte accessible en SSH    | Sandbox gérée par OpenShell                         |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle d’espace de travail** | Bind-mount ou copie               | Canonique distant (ensemencement unique) | `mirror` ou `remote`                                |
| **Contrôle réseau** | `docker.network` (par défaut : none) | Dépend de l’hôte distant       | Dépend de OpenShell                                 |
| **Navigateur sandbox** | Pris en charge                | Non pris en charge             | Pas encore pris en charge                           |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Déporter vers une machine distante | Sandboxes distantes gérées avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le sandboxing est désactivé par défaut. Si vous activez le sandboxing sans choisir de
backend, OpenClaw utilise le backend Docker. Il exécute les outils et navigateurs sandboxés
localement via le socket du daemon Docker (`/var/run/docker.sock`). L’isolation
du conteneur sandbox est déterminée par les espaces de noms Docker.

**Contraintes Docker-out-of-Docker (DooD)** :
Si vous déployez le Gateway OpenClaw lui-même comme conteneur Docker, il orchestre des conteneurs sandbox frères via le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemin :

- **La configuration requiert des chemins hôte** : la configuration `workspace` dans `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par ex. `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Lorsque OpenClaw demande au daemon Docker de lancer une sandbox, le daemon évalue les chemins relativement à l’espace de noms de l’OS hôte, et non à celui du Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif OpenClaw Gateway écrit également des fichiers Heartbeat et bridge dans le répertoire `workspace`. Comme le Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement du Gateway DOIT inclure un mappage de volume identique reliant nativement l’espace de noms hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez des chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur de permission `EACCES` lorsqu’il tente d’écrire son Heartbeat à l’intérieur de l’environnement conteneurisé, car la chaîne de chemin pleinement qualifiée n’existe pas nativement.

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichiers et les lectures de médias sur
une machine arbitraire accessible en SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Ou utilisez SecretRefs / contenu inline au lieu de fichiers locaux :
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Fonctionnement :

- OpenClaw crée une racine distante par portée sous `sandbox.ssh.workspaceRoot`.
- Lors de la première utilisation après création ou recréation, OpenClaw initialise cet espace de travail distant depuis l’espace de travail local une seule fois.
- Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias du prompt et la mise en scène des médias entrants s’exécutent directement sur l’espace de travail distant via SSH.
- OpenClaw ne resynchronise pas automatiquement les modifications distantes vers l’espace de travail local.

Matériel d’authentification :

- `identityFile`, `certificateFile`, `knownHostsFile` : utilisent des fichiers locaux existants et les transmettent via la configuration OpenSSH.
- `identityData`, `certificateData`, `knownHostsData` : utilisent des chaînes inline ou des SecretRefs. OpenClaw les résout via le snapshot runtime normal des secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime à la fin de la session SSH.
- Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

C’est un modèle **canonique distant**. L’espace de travail SSH distant devient le véritable état de sandbox après l’initialisation initiale.

Conséquences importantes :

- Les modifications locales sur l’hôte effectuées en dehors d’OpenClaw après l’étape d’initialisation ne sont pas visibles à distance tant que vous ne recréez pas la sandbox.
- `openclaw sandbox recreate` supprime la racine distante par portée et réinitialise depuis le local lors de l’utilisation suivante.
- Le navigateur sandbox n’est pas pris en charge sur le backend SSH.
- Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un
environnement distant géré par OpenShell. Pour le guide complet de configuration, la référence
de configuration et la comparaison des modes d’espace de travail, voir la
[page OpenShell](/fr/gateway/openshell).

OpenShell réutilise le même transport SSH de base et le même pont de système de fichiers distant que le
backend SSH générique, et ajoute un cycle de vie spécifique à OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail facultatif `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modes OpenShell :

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant `exec` et resynchronise l’espace de travail distant après `exec`.
- `remote` : l’espace de travail OpenShell est canonique après la création de la sandbox. OpenClaw initialise l’espace de travail distant une fois depuis l’espace de travail local, puis les outils de fichiers et `exec` s’exécutent directement sur la sandbox distante sans resynchroniser les modifications.

Détails du transport distant :

- OpenClaw demande à OpenShell une configuration SSH spécifique à la sandbox via `openshell sandbox ssh-config <name>`.
- Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH, et réutilise le même pont de système de fichiers distant que celui utilisé par `backend: "ssh"`.
- En mode `mirror`, seul le cycle de vie diffère : synchronisation du local vers le distant avant `exec`, puis synchronisation inverse après `exec`.

Limites actuelles d’OpenShell :

- le navigateur sandbox n’est pas encore pris en charge
- `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
- les réglages runtime spécifiques à Docker sous `sandbox.docker.*` ne s’appliquent toujours qu’au backend Docker

#### Modes d’espace de travail

OpenShell a deux modèles d’espace de travail. C’est la partie la plus importante en pratique.

##### `mirror`

Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local reste canonique**.

Comportement :

- Avant `exec`, OpenClaw synchronise l’espace de travail local vers la sandbox OpenShell.
- Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’espace de travail local.
- Les outils de fichiers fonctionnent toujours via le pont sandbox, mais l’espace de travail local reste la source de vérité entre les tours.

Utilisez ce mode lorsque :

- vous modifiez des fichiers localement hors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans la sandbox
- vous voulez que la sandbox OpenShell se comporte autant que possible comme le backend Docker
- vous voulez que l’espace de travail hôte reflète les écritures de la sandbox après chaque tour `exec`

Compromis :

- coût de synchronisation supplémentaire avant et après `exec`

##### `remote`

Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell devienne canonique**.

Comportement :

- Lors de la première création de la sandbox, OpenClaw initialise l’espace de travail distant depuis l’espace de travail local une seule fois.
- Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur l’espace de travail OpenShell distant.
- OpenClaw ne synchronise **pas** les modifications distantes vers l’espace de travail local après `exec`.
- Les lectures de médias au moment du prompt continuent de fonctionner, car les outils de fichiers et de médias lisent via le pont sandbox au lieu de supposer un chemin hôte local.
- Le transport se fait via SSH dans la sandbox OpenShell renvoyée par `openshell sandbox ssh-config`.

Conséquences importantes :

- Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’étape d’initialisation, la sandbox distante **ne verra pas** automatiquement ces modifications.
- Si la sandbox est recréée, l’espace de travail distant est réinitialisé depuis l’espace de travail local.
- Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à cette même portée.

Utilisez ce mode lorsque :

- la sandbox doit vivre principalement du côté distant OpenShell
- vous voulez une surcharge de synchronisation plus faible à chaque tour
- vous ne voulez pas que des modifications locales sur l’hôte écrasent silencieusement l’état distant de la sandbox

Choisissez `mirror` si vous considérez la sandbox comme un environnement d’exécution temporaire.
Choisissez `remote` si vous considérez la sandbox comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les sandboxes OpenShell sont toujours gérées via le cycle de vie normal des sandboxes :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer lors de la prochaine utilisation
- la logique de prune est elle aussi sensible au backend

Pour le mode `remote`, la recréation est particulièrement importante :

- la recréation supprime l’espace de travail distant canonique pour cette portée
- l’utilisation suivante initialise un nouvel espace de travail distant à partir de l’espace de travail local

Pour le mode `mirror`, la recréation réinitialise surtout l’environnement d’exécution distant
puisque l’espace de travail local reste de toute façon canonique.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que la sandbox peut voir** :

- `"none"` (par défaut) : les outils voient un espace de travail sandbox sous `~/.openclaw/sandboxes`.
- `"ro"` : monte l’espace de travail de l’agent en lecture seule sur `/agent` (désactive `write`/`edit`/`apply_patch`).
- `"rw"` : monte l’espace de travail de l’agent en lecture/écriture sur `/workspace`.

Avec le backend OpenShell :

- le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les tours `exec`
- le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’initialisation initiale
- `workspaceAccess: "ro"` et `"none"` continuent de restreindre le comportement d’écriture de la même manière

Les médias entrants sont copiés dans l’espace de travail sandbox actif (`media/inbound/*`).
Remarque sur les Skills : l’outil `read` est enraciné dans la sandbox. Avec `workspaceAccess: "none"`,
OpenClaw reflète les Skills éligibles dans l’espace de travail sandbox (`.../skills`) afin
qu’elles puissent être lues. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis
`/workspace/skills`.

## Bind mounts personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôte supplémentaires dans le conteneur.
Format : `host:container:mode` (par ex. `"/home/user/source:/source:rw"`).

Les binds globaux et par agent sont **fusionnés** (et non remplacés). Sous `scope: "shared"`, les binds par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du **navigateur sandbox**.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur navigateur.
- Lorsqu’il est omis, le conteneur navigateur se replie sur `agents.defaults.sandbox.docker.binds` (rétrocompatible).

Exemple (source en lecture seule + répertoire de données supplémentaire) :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Remarques de sécurité :

- Les binds contournent le système de fichiers de la sandbox : ils exposent des chemins hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines courantes d’identifiants dans le répertoire personnel comme `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des binds ne repose pas seulement sur la correspondance de chaînes. OpenClaw normalise le chemin source, puis le résout à nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappées via parent symlink échouent toujours en mode fermé même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout tout de même en `/var/run/...` si `run-link` pointe vers cet emplacement.
- Les racines sources autorisées sont canonisées de la même manière, de sorte qu’un chemin qui semble seulement être dans la liste d’autorisation avant résolution des symlinks est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro` sauf nécessité absolue.
- Combinez cela avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture à l’espace de travail ; les modes de bind restent indépendants.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour la manière dont les binds interagissent avec la politique d’outils et l’exécution elevated.

## Images + configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

Construisez-la une fois :

```bash
scripts/sandbox-setup.sh
```

Remarque : l’image par défaut n’inclut **pas** Node. Si une Skill a besoin de Node (ou
d’autres runtimes), intégrez une image personnalisée ou installez-les via
`sandbox.docker.setupCommand` (nécessite un accès réseau sortant + une racine inscriptible +
un utilisateur root).

Si vous voulez une image sandbox plus fonctionnelle avec des outils courants (par exemple
`curl`, `jq`, `nodejs`, `python3`, `git`), construisez :

```bash
scripts/sandbox-common-setup.sh
```

Définissez ensuite `agents.defaults.sandbox.docker.image` sur
`openclaw-sandbox-common:bookworm-slim`.

Image du navigateur sandbox :

```bash
scripts/sandbox-browser-setup.sh
```

Par défaut, les conteneurs sandbox Docker s’exécutent **sans réseau**.
Remplacez cela avec `agents.defaults.sandbox.docker.network`.

L’image de navigateur sandbox intégrée applique aussi des valeurs de démarrage Chromium prudentes
pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` lorsque `noSandbox` est activé.
- Les trois options de durcissement graphique (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sont facultatives et utiles
  lorsque les conteneurs n’ont pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/navigateur.
- `--disable-extensions` est activé par défaut et peut être désactivé avec
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendants d’extensions.
- `--renderer-process-limit=2` est contrôlé par
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

Si vous avez besoin d’un profil runtime différent, utilisez une image navigateur personnalisée et fournissez
votre propre entrypoint. Pour les profils Chromium locaux (hors conteneur), utilisez
`browser.extraArgs` pour ajouter des options de démarrage supplémentaires.

Valeurs de sécurité par défaut :

- `network: "host"` est bloqué.
- `network: "container:<id>"` est bloqué par défaut (risque de contournement par jointure d’espace de noms).
- Remplacement break-glass : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Les installations Docker et le gateway conteneurisé se trouvent ici :
[Docker](/fr/install/docker)

Pour les déploiements Docker du gateway, `scripts/docker/setup.sh` peut initialiser la configuration sandbox.
Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez
remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Référence complète de configuration et des variables d’environnement :
[Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration de conteneur en une fois)

`setupCommand` s’exécute **une seule fois** après la création du conteneur sandbox (pas à chaque exécution).
Il s’exécute à l’intérieur du conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

Pièges courants :

- Le `docker.network` par défaut est `"none"` (pas d’egress), donc les installations de paquets échoueront.
- `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et est réservé au break-glass.
- `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
- `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
- Le sandbox exec n’hérite **pas** de `process.env` de l’hôte. Utilisez
  `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API des Skills.

## Politique d’outils + échappatoires

Les politiques allow/deny des outils s’appliquent toujours avant les règles de sandbox. Si un outil est refusé
globalement ou par agent, le sandboxing ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors de la sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est `node`).
Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver
complètement `exec`, utilisez un refus dans la politique d’outils (voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode sandbox effectif, la politique d’outils et les clés de configuration correctives.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi est-ce bloqué ? ».
  Gardez cela verrouillé.

## Remplacements multi-agent

Chaque agent peut remplacer sandbox + outils :
`agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique d’outils sandbox).
Voir [Sandbox & Tools multi-agent](/fr/tools/multi-agent-sandbox-tools) pour la priorité.

## Exemple minimal d’activation

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Documentation connexe

- [OpenShell](/fr/gateway/openshell) -- configuration du backend sandbox géré, modes d’espace de travail et référence de configuration
- [Configuration du sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi est-ce bloqué ? »
- [Sandbox & Tools multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et priorité
- [Sécurité](/fr/gateway/security)
