---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Fonctionnement de l’isolation en bac à sable d’OpenClaw : modes, périmètres, accès à l’espace de travail et images'
title: Mise en bac à sable
x-i18n:
    generated_at: "2026-05-02T07:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw peut exécuter des **outils dans des backends de bac à sable** afin de réduire le rayon d’impact. Cela est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Si le bac à sable est désactivé, les outils s’exécutent sur l’hôte. Le Gateway reste sur l’hôte ; l’exécution des outils a lieu dans un bac à sable isolé lorsqu’il est activé.

<Note>
Ce n’est pas une frontière de sécurité parfaite, mais cela limite concrètement l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.
</Note>

## Ce qui est placé en bac à sable

- Exécution d’outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur facultatif en bac à sable (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Détails du navigateur en bac à sable">
    - Par défaut, le navigateur en bac à sable démarre automatiquement (afin de garantir que CDP est joignable) lorsque l’outil de navigation en a besoin. Configurez-le via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Par défaut, les conteneurs de navigateur en bac à sable utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`. Configurez-le avec `agents.defaults.sandbox.browser.network`.
    - Le paramètre facultatif `agents.defaults.sandbox.browser.cdpSourceRange` limite l’entrée CDP au bord du conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
    - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL à jeton de courte durée qui sert une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de requête ou d’en-têtes).
    - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions en bac à sable de cibler explicitement le navigateur de l’hôte.
    - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non placé en bac à sable :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du bac à sable (par exemple `tools.elevated`).
  - **L’exécution élevée contourne le bac à sable et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`).**
  - Si le bac à sable est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Mode élevé](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le bac à sable est utilisé :

<Tabs>
  <Tab title="off">
    Aucun bac à sable.
  </Tab>
  <Tab title="non-main">
    Place uniquement les sessions **non-main** en bac à sable (valeur par défaut si vous voulez que les discussions normales restent sur l’hôte).

    `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), pas sur l’identifiant de l’agent. Les sessions de groupe/canal utilisent leurs propres clés, elles comptent donc comme non-main et seront placées en bac à sable.

  </Tab>
  <Tab title="all">
    Chaque session s’exécute dans un bac à sable.
  </Tab>
</Tabs>

## Portée

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions en bac à sable.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit le bac à sable :

- `"docker"` (par défaut lorsque le bac à sable est activé) : runtime de bac à sable local adossé à Docker.
- `"ssh"` : runtime de bac à sable distant générique adossé à SSH.
- `"openshell"` : runtime de bac à sable adossé à OpenShell.

La configuration propre à SSH se trouve sous `agents.defaults.sandbox.ssh`. La configuration propre à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où il s’exécute** | Conteneur local                  | Tout hôte accessible par SSH   | Bac à sable géré par OpenShell                      |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle d’espace de travail** | Montage lié ou copie               | Distant canonique (amorçage unique) | `mirror` ou `remote`                                |
| **Contrôle réseau** | `docker.network` (par défaut : none) | Dépend de l’hôte distant       | Dépend d’OpenShell                                  |
| **Navigateur en bac à sable** | Pris en charge                    | Non pris en charge             | Pas encore pris en charge                           |
| **Montages liés**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Déport vers une machine distante | Bacs à sable distants gérés avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le bac à sable est désactivé par défaut. Si vous activez le bac à sable sans choisir de backend, OpenClaw utilise le backend Docker. Il exécute les outils et les navigateurs en bac à sable localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation du conteneur de bac à sable est déterminée par les espaces de noms Docker.

Pour exposer les GPU de l’hôte aux bacs à sable Docker, définissez `agents.defaults.sandbox.docker.gpus` ou la surcharge par agent `agents.list[].sandbox.docker.gpus`. La valeur est transmise au drapeau `--gpus` de Docker comme argument séparé, par exemple `"all"` ou `"device=GPU-uuid"`, et nécessite un runtime hôte compatible tel que NVIDIA Container Toolkit.

<Warning>
**Contraintes Docker-out-of-Docker (DooD)**

Si vous déployez le Gateway OpenClaw lui-même comme conteneur Docker, il orchestre des conteneurs de bac à sable frères en utilisant le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemins :

- **La configuration exige des chemins hôte** : la configuration `workspace` de `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par exemple `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Lorsque OpenClaw demande au démon Docker de lancer un bac à sable, le démon évalue les chemins relativement à l’espace de noms du système d’exploitation hôte, pas à l’espace de noms du Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif du Gateway OpenClaw écrit également les fichiers Heartbeat et de pont dans le répertoire `workspace`. Comme le Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement du Gateway DOIT inclure un mappage de volume identique reliant nativement l’espace de noms hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez les chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur d’autorisation `EACCES` lorsqu’il tente d’écrire son Heartbeat dans l’environnement du conteneur, car la chaîne de chemin entièrement qualifiée n’existe pas nativement.
</Warning>

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw place `exec`, les outils de fichiers et les lectures de médias en bac à sable sur une machine arbitraire accessible par SSH.

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Fonctionnement">
    - OpenClaw crée une racine distante par portée sous `sandbox.ssh.workspaceRoot`.
    - À la première utilisation après création ou recréation, OpenClaw amorce une fois cet espace de travail distant depuis l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias de prompt et le staging de médias entrants s’exécutent directement contre l’espace de travail distant via SSH.
    - OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.

  </Accordion>
  <Accordion title="Matériel d’authentification">
    - `identityFile`, `certificateFile`, `knownHostsFile` : utilisent des fichiers locaux existants et les transmettent via la configuration OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData` : utilisent des chaînes en ligne ou des SecretRefs. OpenClaw les résout via l’instantané runtime normal des secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime lorsque la session SSH se termine.
    - Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

  </Accordion>
  <Accordion title="Conséquences du modèle distant canonique">
    Il s’agit d’un modèle **distant canonique**. L’espace de travail SSH distant devient le véritable état du bac à sable après l’amorçage initial.

    - Les modifications locales hôte effectuées hors d’OpenClaw après l’étape d’amorçage ne sont pas visibles à distance tant que vous ne recréez pas le bac à sable.
    - `openclaw sandbox recreate` supprime la racine distante par portée et amorce de nouveau depuis le local à la prochaine utilisation.
    - Le bac à sable de navigateur n’est pas pris en charge sur le backend SSH.
    - Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw place les outils en bac à sable dans un environnement distant géré par OpenShell. Pour le guide de configuration complet, la référence de configuration et la comparaison des modes d’espace de travail, consultez la [page OpenShell dédiée](/fr/gateway/openshell).

OpenShell réutilise le même transport SSH principal et le même pont de système de fichiers distant que le backend SSH générique, et ajoute le cycle de vie propre à OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail facultatif `mirror`.

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

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant l’exécution, puis synchronise l’espace de travail distant en retour après l’exécution.
- `remote` : l’espace de travail OpenShell est canonique après la création du bac à sable. OpenClaw amorce une fois l’espace de travail distant depuis l’espace de travail local, puis les outils de fichiers et l’exécution opèrent directement contre le bac à sable distant sans synchroniser les modifications en retour.

<AccordionGroup>
  <Accordion title="Détails du transport distant">
    - OpenClaw demande à OpenShell la configuration SSH propre au bac à sable via `openshell sandbox ssh-config <name>`.
    - Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH et réutilise le même pont de système de fichiers distant que celui utilisé par `backend: "ssh"`.
    - En mode `mirror`, seul le cycle de vie diffère : synchronisation du local vers le distant avant l’exécution, puis synchronisation en retour après l’exécution.

  </Accordion>
  <Accordion title="Limitations actuelles d’OpenShell">
    - le navigateur en bac à sable n’est pas encore pris en charge
    - `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
    - les réglages de runtime propres à Docker sous `sandbox.docker.*` continuent de s’appliquer uniquement au backend Docker

  </Accordion>
</AccordionGroup>

#### Modes d’espace de travail

OpenShell propose deux modèles d’espace de travail. C’est la partie la plus importante en pratique.

<Tabs>
  <Tab title="mirror (local canonique)">
    Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local reste canonique**.

    Comportement :

    - Avant `exec`, OpenClaw synchronise l’espace de travail local dans le bac à sable OpenShell.
    - Après `exec`, OpenClaw synchronise l’espace de travail distant vers l’espace de travail local.
    - Les outils de fichiers opèrent toujours via le pont de bac à sable, mais l’espace de travail local reste la source de vérité entre les tours.

    Utilisez ce mode lorsque :

    - vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces modifications apparaissent automatiquement dans le sandbox
    - vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
    - vous voulez que l’espace de travail hôte reflète les écritures du sandbox après chaque tour d’exécution

    Compromis : coût de synchronisation supplémentaire avant et après l’exécution.

  </Tab>
  <Tab title="remote (OpenShell canonique)">
    Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell devienne canonique**.

    Comportement :

    - Lorsque le sandbox est créé pour la première fois, OpenClaw initialise une fois l’espace de travail distant depuis l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur l’espace de travail OpenShell distant.
    - OpenClaw ne synchronise **pas** les modifications distantes vers l’espace de travail local après l’exécution.
    - Les lectures de médias au moment du prompt fonctionnent toujours, car les outils de fichiers et de médias lisent via le pont du sandbox au lieu de supposer un chemin hôte local.
    - Le transport se fait par SSH vers le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

    Conséquences importantes :

    - Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’étape d’initialisation, le sandbox distant ne verra **pas** automatiquement ces modifications.
    - Si le sandbox est recréé, l’espace de travail distant est de nouveau initialisé depuis l’espace de travail local.
    - Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à cette même portée.

    Utilisez ceci lorsque :

    - le sandbox doit résider principalement côté OpenShell distant
    - vous voulez réduire le surcoût de synchronisation à chaque tour
    - vous ne voulez pas que des modifications locales à l’hôte écrasent silencieusement l’état du sandbox distant

  </Tab>
</Tabs>

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire. Choisissez `remote` si vous considérez le sandbox comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les sandboxes OpenShell sont toujours gérés via le cycle de vie normal des sandboxes :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer à la prochaine utilisation
- la logique de nettoyage est également consciente du backend

Pour le mode `remote`, la recréation est particulièrement importante :

- la recréation supprime l’espace de travail distant canonique pour cette portée
- la prochaine utilisation initialise un nouvel espace de travail distant depuis l’espace de travail local

Pour le mode `mirror`, la recréation réinitialise surtout l’environnement d’exécution distant, car l’espace de travail local reste de toute façon canonique.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

<Tabs>
  <Tab title="none (par défaut)">
    Les outils voient un espace de travail de sandbox sous `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monte l’espace de travail de l’agent en lecture seule sur `/agent` (désactive `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monte l’espace de travail de l’agent en lecture/écriture sur `/workspace`.
  </Tab>
</Tabs>

Avec le backend OpenShell :

- le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les tours d’exécution
- le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’initialisation initiale
- `workspaceAccess: "ro"` et `"none"` restreignent toujours le comportement d’écriture de la même manière

Les médias entrants sont copiés dans l’espace de travail du sandbox actif (`media/inbound/*`).

<Note>
**Note sur les Skills :** l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`, OpenClaw met en miroir les Skills éligibles dans l’espace de travail du sandbox (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis `/workspace/skills`.
</Note>

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôtes supplémentaires dans le conteneur. Format : `host:container:mode` (par exemple, `"/home/user/source:/source:rw"`).

Les montages bind globaux et par agent sont **fusionnés** (et non remplacés). Sous `scope: "shared"`, les montages bind par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur du **navigateur de sandbox**.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur du navigateur.
- Lorsqu’il est omis, le conteneur du navigateur se rabat sur `agents.defaults.sandbox.docker.binds` (rétrocompatible).

Exemple (source en lecture seule + un répertoire de données supplémentaire) :

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

<Warning>
**Sécurité des montages bind**

- Les montages bind contournent le système de fichiers du sandbox : ils exposent des chemins hôtes avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de montage bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque également les racines de répertoires personnels courantes contenant des identifiants, comme `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des montages bind ne se limite pas à une correspondance de chaînes. OpenClaw normalise le chemin source, puis le résout à nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappements via un parent symbolique échouent toujours de manière fermée, même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours en `/var/run/...` si `run-link` pointe vers cet emplacement.
- Les racines sources autorisées sont canonisées de la même manière, de sorte qu’un chemin qui ne semble être dans la liste d’autorisation qu’avant la résolution des liens symboliques est toujours rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro` sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture à l’espace de travail ; les modes de montage bind restent indépendants.
- Consultez [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre comment les montages bind interagissent avec la politique d’outils et l’exécution élevée.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Note>
**Extraction des sources vs installation npm**

Les scripts d’aide `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` et `scripts/sandbox-browser-setup.sh` ne sont disponibles que lors d’une exécution depuis une [extraction des sources](https://github.com/openclaw/openclaw). Ils ne sont pas inclus dans le paquet npm.

Si vous avez installé OpenClaw via `npm install -g openclaw`, utilisez plutôt les commandes `docker build` en ligne indiquées ci-dessous.
</Note>

<Steps>
  <Step title="Construire l’image par défaut">
    Depuis une extraction des sources :

    ```bash
    scripts/sandbox-setup.sh
    ```

    Depuis une installation npm (aucune extraction des sources nécessaire) :

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    L’image par défaut n’inclut **pas** Node. Si une Skill a besoin de Node (ou d’autres runtimes), intégrez un image personnalisée ou installez via `sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible + l’utilisateur root).

    OpenClaw ne remplace pas silencieusement par `debian:bookworm-slim` brut lorsque `openclaw-sandbox:bookworm-slim` est manquant. Les exécutions de sandbox qui ciblent l’image par défaut échouent rapidement avec une instruction de construction jusqu’à ce que vous la construisiez, car l’image fournie embarque `python3` pour les aides d’écriture/modification du sandbox.

  </Step>
  <Step title="Facultatif : construire l’image commune">
    Pour une image de sandbox plus fonctionnelle avec des outils courants (par exemple `curl`, `jq`, `nodejs`, `python3`, `git`) :

    Depuis une extraction des sources :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Depuis une installation npm, construisez d’abord l’image par défaut (voir ci-dessus), puis construisez l’image commune par-dessus en utilisant le [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) du dépôt.

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facultatif : construire l’image du navigateur de sandbox">
    Depuis une extraction des sources :

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Depuis une installation npm, construisez avec le [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) du dépôt.

  </Step>
</Steps>

Par défaut, les conteneurs de sandbox Docker s’exécutent **sans réseau**. Remplacez ce comportement avec `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valeurs par défaut Chromium du navigateur de sandbox">
    L’image de navigateur de sandbox fournie applique également des valeurs par défaut conservatrices au démarrage de Chromium pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

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
    - Les trois indicateurs de durcissement graphique (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles lorsque les conteneurs ne disposent pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/navigateur.
    - `--disable-extensions` est activé par défaut et peut être désactivé avec `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendant des extensions.
    - `--renderer-process-limit=2` est contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un profil d’exécution différent, utilisez une image de navigateur personnalisée et fournissez votre propre point d’entrée. Pour les profils Chromium locaux (hors conteneur), utilisez `browser.extraArgs` pour ajouter des indicateurs de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Valeurs par défaut de sécurité réseau">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par jonction d’espace de noms).
    - Remplacement d’urgence : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et le Gateway conteneurisé se trouvent ici : [Docker](/fr/install/docker)

Pour les déploiements du Gateway Docker, `scripts/docker/setup.sh` peut initialiser la configuration du sandbox. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence des variables d’environnement : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration ponctuelle du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur de sandbox (pas à chaque exécution). Il s’exécute à l’intérieur du conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Pièges courants">
    - La valeur par défaut de `docker.network` est `"none"` (aucune sortie), donc les installations de paquets échoueront.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et est réservé aux situations d’urgence.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
    - `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
    - L’exécution du sandbox n’hérite **pas** du `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API des Skills.

  </Accordion>
</AccordionGroup>

## Politique des outils et échappatoires

Les politiques d’autorisation/de refus des outils s’appliquent toujours avant les règles du bac à sable. Si un outil est refusé globalement ou par agent, le bac à sable ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors du bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver complètement `exec`, utilisez un refus dans la politique des outils (voir [Bac à sable vs Politique des outils vs Élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode de bac à sable effectif, la politique des outils et les clés de configuration correctives.
- Consultez [Bac à sable vs Politique des outils vs Élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi est-ce bloqué ? ».

Gardez-le verrouillé.

## Remplacements multi-agents

Chaque agent peut remplacer le bac à sable et les outils : `agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique des outils du bac à sable). Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour la précédence.

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

## Connexe

- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) — remplacements par agent et précédence
- [OpenShell](/fr/gateway/openshell) — configuration du backend de bac à sable géré, modes d’espace de travail et référence de configuration
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable vs Politique des outils vs Élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage « pourquoi est-ce bloqué ? »
- [Sécurité](/fr/gateway/security)
