---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Fonctionnement du sandboxing d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Bac à sable
x-i18n:
    generated_at: "2026-06-27T17:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw peut exécuter des **outils dans des backends de bac à sable** afin de réduire le rayon d’impact. C’est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Si le bac à sable est désactivé, les outils s’exécutent sur l’hôte. Le Gateway reste sur l’hôte ; l’exécution des outils se fait dans un bac à sable isolé lorsqu’elle est activée.

<Note>
Ce n’est pas une frontière de sécurité parfaite, mais cela limite concrètement l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose d’inadapté.
</Note>

## Ce qui est exécuté dans le bac à sable

- Exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur facultatif en bac à sable (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Détails du navigateur en bac à sable">
    - Par défaut, le navigateur en bac à sable démarre automatiquement (ce qui garantit que CDP est accessible) quand l’outil de navigateur en a besoin. Configurez-le via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Par défaut, les conteneurs du navigateur en bac à sable utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`. Configurez-le avec `agents.defaults.sandbox.browser.network`.
    - L’option facultative `agents.defaults.sandbox.browser.cdpSourceRange` restreint l’entrée CDP côté conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
    - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL avec jeton de courte durée qui sert une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de requête/en-tête).
    - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions en bac à sable de cibler explicitement le navigateur de l’hôte.
    - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non exécuté dans le bac à sable :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter en dehors du bac à sable (par exemple `tools.elevated`).
  - **L’exec élevé contourne le bac à sable et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` quand la cible exec est `node`).**
  - Si le bac à sable est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Consultez [Mode élevé](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le bac à sable est utilisé :

<Tabs>
  <Tab title="off">
    Aucun bac à sable.
  </Tab>
  <Tab title="non-main">
    N’exécute dans le bac à sable que les sessions **non-main** (par défaut si vous voulez que les discussions normales restent sur l’hôte).

    `"non-main"` est basé sur `session.mainKey` (`"main"` par défaut), et non sur l’identifiant de l’agent. Les sessions de groupe/canal utilisent leurs propres clés ; elles sont donc considérées comme non-main et seront exécutées dans le bac à sable.

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
| **Modèle d’espace de travail** | Montage lié ou copie | Canonique distant (initialisé une fois) | `mirror` ou `remote`                      |
| **Contrôle réseau** | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant | Dépend d’OpenShell                                  |
| **Navigateur en bac à sable** | Pris en charge          | Non pris en charge             | Pas encore pris en charge                           |
| **Montages liés**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Déchargement vers une machine distante | Bacs à sable distants gérés avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le bac à sable est désactivé par défaut. Si vous activez le bac à sable sans choisir de backend, OpenClaw utilise le backend Docker. Il exécute les outils et les navigateurs en bac à sable localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation des conteneurs de bac à sable est déterminée par les espaces de noms Docker.

Pour exposer les GPU de l’hôte aux bacs à sable Docker, définissez `agents.defaults.sandbox.docker.gpus` ou la surcharge par agent `agents.list[].sandbox.docker.gpus`. La valeur est transmise au flag `--gpus` de Docker comme argument séparé, par exemple `"all"` ou `"device=GPU-uuid"`, et nécessite un runtime hôte compatible comme NVIDIA Container Toolkit.

<Warning>
**Contraintes Docker-out-of-Docker (DooD)**

Si vous déployez le Gateway OpenClaw lui-même comme conteneur Docker, il orchestre des conteneurs de bac à sable frères en utilisant le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemins :

- **La configuration exige des chemins hôte** : la configuration `workspace` de `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par exemple `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Quand OpenClaw demande au démon Docker de lancer un bac à sable, le démon évalue les chemins relativement à l’espace de noms du système d’exploitation hôte, pas à l’espace de noms du Gateway.
- **Parité du pont FS (mappage de volumes identique)** : le processus natif du Gateway OpenClaw écrit aussi les fichiers heartbeat et bridge dans le répertoire `workspace`. Comme le Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement du Gateway DOIT inclure un mappage de volume identique reliant nativement l’espace de noms hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Mode code Codex** : lorsqu’un bac à sable OpenClaw est actif, OpenClaw désactive le Code Mode natif du serveur d’application Codex, les serveurs MCP utilisateur et l’exécution de Plugin adossée à l’application pour ce tour, car ces surfaces natives s’exécutent depuis le processus de serveur d’application hôte du Gateway au lieu du backend de bac à sable OpenClaw. L’accès shell est exposé via des outils adossés au bac à sable OpenClaw comme `sandbox_exec` et `sandbox_process` lorsque les outils exec/process normaux sont disponibles. Ne montez pas le socket Docker de l’hôte dans les conteneurs de bac à sable agent ou dans des bacs à sable Codex personnalisés.

Sur les hôtes Ubuntu/AppArmor, Codex `workspace-write` peut échouer avant le démarrage du shell
lorsque vous exécutez intentionnellement le `workspace-write` natif de Codex sans bac à sable
OpenClaw actif et que l’utilisateur de service n’est pas autorisé à créer des espaces de noms
utilisateur non privilégiés. Quand la sortie réseau du bac à sable Docker est désactivée (`network: "none"`, la
valeur par défaut), Codex a aussi besoin d’un espace de noms réseau non privilégié. Les symptômes courants sont
`bwrap: setting up uid map: Permission denied` et
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Exécutez
`openclaw doctor` ; s’il signale un échec de sonde d’espace de noms bwrap Codex, privilégiez
un profil AppArmor qui accorde les espaces de noms requis au processus de service OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` est une solution de repli globale à l’hôte
avec des compromis de sécurité ; ne l’utilisez que lorsque cette posture hôte est
acceptable.

Si vous mappez des chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur d’autorisation `EACCES` lors de la tentative d’écriture de son heartbeat dans l’environnement du conteneur, car la chaîne de chemin pleinement qualifiée n’existe pas nativement.
</Warning>

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw exécute `exec`, les outils de fichiers et les lectures de médias dans un bac à sable sur une machine arbitraire accessible par SSH.

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
    - À la première utilisation après création ou recréation, OpenClaw initialise une seule fois cet espace de travail distant depuis l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias de prompt et la préparation des médias entrants s’exécutent directement contre l’espace de travail distant via SSH.
    - OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.

  </Accordion>
  <Accordion title="Matériel d’authentification">
    - `identityFile`, `certificateFile`, `knownHostsFile` : utilisez des fichiers locaux existants et transmettez-les via la configuration OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData` : utilisez des chaînes inline ou des SecretRefs. OpenClaw les résout via l’instantané normal du runtime de secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime à la fin de la session SSH.
    - Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

  </Accordion>
  <Accordion title="Conséquences du modèle canonique distant">
    Il s’agit d’un modèle **canonique distant**. L’espace de travail SSH distant devient l’état réel du bac à sable après l’initialisation initiale.

    - Les modifications locales à l’hôte effectuées en dehors d’OpenClaw après l’étape d’initialisation ne sont pas visibles à distance tant que vous ne recréez pas le bac à sable.
    - `openclaw sandbox recreate` supprime la racine distante par portée et réinitialise depuis le local à la prochaine utilisation.
    - Le bac à sable de navigateur n’est pas pris en charge sur le backend SSH.
    - Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw exécute les outils dans un bac à sable au sein d’un environnement distant géré par OpenShell. Pour le guide de configuration complet, la référence de configuration et la comparaison des modes d’espace de travail, consultez la [page OpenShell dédiée](/fr/gateway/openshell).

OpenShell réutilise le même transport SSH central et le même pont de système de fichiers distant que le backend SSH générique, et ajoute le cycle de vie propre à OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail facultatif `mirror`.

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

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant exec et resynchronise l’espace de travail distant après exec.
- `remote` : l’espace de travail OpenShell est canonique après la création du bac à sable. OpenClaw initialise l’espace de travail distant une seule fois depuis l’espace de travail local, puis les outils de fichiers et exec s’exécutent directement contre le bac à sable distant sans resynchroniser les modifications.

<AccordionGroup>
  <Accordion title="Détails du transport distant">
    - OpenClaw demande à OpenShell la configuration SSH propre au sandbox via `openshell sandbox ssh-config <name>`.
    - Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH et réutilise le même pont de système de fichiers distant que celui utilisé par `backend: "ssh"`.
    - En mode `mirror`, seul le cycle de vie diffère : synchronisation du local vers le distant avant exec, puis resynchronisation après exec.

  </Accordion>
  <Accordion title="Limitations actuelles d’OpenShell">
    - le navigateur du sandbox n’est pas encore pris en charge
    - `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
    - les réglages d’exécution propres à Docker sous `sandbox.docker.*` ne s’appliquent toujours qu’au backend Docker

  </Accordion>
</AccordionGroup>

#### Modes de workspace

OpenShell propose deux modèles de workspace. C’est la partie la plus importante en pratique.

<Tabs>
  <Tab title="mirror (local canonique)">
    Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que le **workspace local reste canonique**.

    Comportement :

    - Avant `exec`, OpenClaw synchronise le workspace local vers le sandbox OpenShell.
    - Après `exec`, OpenClaw synchronise le workspace distant vers le workspace local.
    - Les outils de fichiers fonctionnent toujours via le pont du sandbox, mais le workspace local reste la source de vérité entre les tours.

    Utilisez ce mode lorsque :

    - vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le sandbox
    - vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
    - vous voulez que le workspace hôte reflète les écritures du sandbox après chaque tour d’exec

    Compromis : coût de synchronisation supplémentaire avant et après exec.

  </Tab>
  <Tab title="remote (OpenShell canonique)">
    Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que le **workspace OpenShell devienne canonique**.

    Comportement :

    - Lorsque le sandbox est créé pour la première fois, OpenClaw initialise une fois le workspace distant à partir du workspace local.
    - Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur le workspace OpenShell distant.
    - OpenClaw ne synchronise **pas** les changements distants vers le workspace local après exec.
    - Les lectures de médias au moment du prompt fonctionnent toujours, car les outils de fichiers et de médias lisent via le pont du sandbox au lieu de supposer un chemin d’hôte local.
    - Le transport est SSH vers le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

    Conséquences importantes :

    - Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’étape d’initialisation, le sandbox distant ne verra **pas** ces changements automatiquement.
    - Si le sandbox est recréé, le workspace distant est à nouveau initialisé à partir du workspace local.
    - Avec `scope: "agent"` ou `scope: "shared"`, ce workspace distant est partagé dans ce même périmètre.

    Utilisez ce mode lorsque :

    - le sandbox doit vivre principalement côté OpenShell distant
    - vous voulez réduire le coût de synchronisation par tour
    - vous ne voulez pas que les modifications locales de l’hôte écrasent silencieusement l’état du sandbox distant

  </Tab>
</Tabs>

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire. Choisissez `remote` si vous considérez le sandbox comme le vrai workspace.

#### Cycle de vie OpenShell

Les sandboxes OpenShell restent gérés via le cycle de vie normal des sandboxes :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer à la prochaine utilisation
- la logique de nettoyage tient également compte du backend

Pour le mode `remote`, la recréation est particulièrement importante :

- recréer supprime le workspace distant canonique pour ce périmètre
- la prochaine utilisation initialise un nouveau workspace distant à partir du workspace local

Pour le mode `mirror`, recréer réinitialise surtout l’environnement d’exécution distant, car le workspace local reste de toute façon canonique.

## Accès au workspace

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

<Tabs>
  <Tab title="none (par défaut)">
    Les outils voient un workspace de sandbox sous `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monte le workspace de l’agent en lecture seule sur `/agent` (désactive `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monte le workspace de l’agent en lecture/écriture sur `/workspace`.
  </Tab>
</Tabs>

Avec le backend OpenShell :

- le mode `mirror` utilise toujours le workspace local comme source canonique entre les tours d’exec
- le mode `remote` utilise le workspace OpenShell distant comme source canonique après l’initialisation initiale
- `workspaceAccess: "ro"` et `"none"` restreignent toujours le comportement d’écriture de la même manière

Les médias entrants sont copiés dans le workspace du sandbox actif (`media/inbound/*`).

<Note>
**Note sur les Skills :** l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`, OpenClaw réplique les Skills éligibles dans le workspace du sandbox (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills du workspace sont lisibles depuis `/workspace/skills`, et les Skills éligibles gérés, intégrés ou de Plugin sont matérialisés dans le chemin généré en lecture seule `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôtes supplémentaires dans le conteneur. Format : `host:container:mode` (par exemple, `"/home/user/source:/source:rw"`).

Les binds globaux et propres à un agent sont **fusionnés** (et non remplacés). Sous `scope: "shared"`, les binds propres à un agent sont ignorés.

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
**Sécurité des binds**

- Les binds contournent le système de fichiers du sandbox : ils exposent des chemins hôtes avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` et les montages parents qui les exposeraient).
- OpenClaw bloque également les racines courantes d’identifiants dans le répertoire personnel, telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des binds ne se limite pas à une correspondance de chaînes. OpenClaw normalise le chemin source, puis le résout à nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappements via parent symbolique échouent toujours de manière fermée, même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours comme `/var/run/...` si `run-link` pointe là-bas.
- Les racines sources autorisées sont canonisées de la même manière, de sorte qu’un chemin qui semble appartenir à la liste d’autorisation avant la résolution des liens symboliques est tout de même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro`, sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous avez uniquement besoin d’un accès en lecture au workspace ; les modes de bind restent indépendants.
- Consultez [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour savoir comment les binds interagissent avec la politique d’outils et l’exec élevée.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout source vs installation npm**

Les scripts d’aide `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` et `scripts/sandbox-browser-setup.sh` ne sont disponibles que lors d’une exécution depuis un [checkout source](https://github.com/openclaw/openclaw). Ils ne sont pas inclus dans le package npm.

Si vous avez installé OpenClaw via `npm install -g openclaw`, utilisez plutôt les commandes `docker build` intégrées affichées ci-dessous.
</Note>

<Steps>
  <Step title="Construire l’image par défaut">
    Depuis un checkout source :

    ```bash
    scripts/sandbox-setup.sh
    ```

    Depuis une installation npm (aucun checkout source nécessaire) :

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

    L’image par défaut n’inclut **pas** Node. Si une Skill a besoin de Node (ou d’autres runtimes), intégrez-les dans une image personnalisée ou installez-les via `sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible + l’utilisateur root).

    OpenClaw ne substitue pas silencieusement `debian:bookworm-slim` brut lorsque `openclaw-sandbox:bookworm-slim` est manquant. Les exécutions de sandbox qui ciblent l’image par défaut échouent rapidement avec une instruction de build jusqu’à ce que vous la construisiez, car l’image intégrée fournit `python3` pour les aides d’écriture/modification du sandbox.

  </Step>
  <Step title="Facultatif : construire l’image commune">
    Pour une image de sandbox plus fonctionnelle avec des outils courants (par exemple `curl`, `jq`, Node 24, pnpm, `python3` et `git`) :

    Depuis un checkout source :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Depuis une installation npm, construisez d’abord l’image par défaut (voir ci-dessus), puis construisez l’image commune par-dessus à l’aide de [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) depuis le dépôt.

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facultatif : construire l’image du navigateur de sandbox">
    Depuis un checkout source :

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Depuis une installation npm, construisez avec [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) depuis le dépôt.

  </Step>
</Steps>

Par défaut, les conteneurs de sandbox Docker s’exécutent **sans réseau**. Remplacez ce comportement avec `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valeurs par défaut de Chromium pour le navigateur de sandbox">
    L’image intégrée du navigateur de sandbox applique également des valeurs par défaut prudentes au démarrage de Chromium pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

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
    - Les trois indicateurs de durcissement graphique (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles lorsque les conteneurs ne disposent pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/de navigateur.
    - `--disable-extensions` est activé par défaut et peut être désactivé avec `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendants des extensions.
    - `--renderer-process-limit=2` est contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un profil d’exécution différent, utilisez une image de navigateur personnalisée et fournissez votre propre entrypoint. Pour les profils Chromium locaux (hors conteneur), utilisez `browser.extraArgs` pour ajouter des indicateurs de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Paramètres de sécurité réseau par défaut">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par jonction d’espace de noms).
    - Dérogation d’urgence : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et le Gateway conteneurisé se trouvent ici : [Docker](/fr/install/docker)

Pour les déploiements du Gateway Docker, `scripts/docker/setup.sh` peut amorcer la configuration de sandbox. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence des variables d’environnement : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration ponctuelle du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur de sandbox (pas à chaque exécution). Elle s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Pièges courants">
    - La valeur par défaut de `docker.network` est `"none"` (aucune sortie réseau), donc les installations de paquets échoueront.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et doit être réservé aux dérogations d’urgence.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou préparez une image personnalisée.
    - `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
    - L’exécution dans la sandbox n’hérite **pas** de `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API des Skills.
    - Les valeurs dans `agents.defaults.sandbox.docker.env` sont transmises comme variables d’environnement explicites du conteneur Docker. Toute personne ayant accès au démon Docker peut les inspecter avec des commandes de métadonnées Docker telles que `docker inspect`. Utilisez une image personnalisée, un fichier secret monté ou un autre chemin de transmission de secrets si cette exposition des métadonnées n’est pas acceptable.

  </Accordion>
</AccordionGroup>

## Politique des outils et échappatoires

Les politiques d’autorisation/refus des outils s’appliquent toujours avant les règles de sandbox. Si un outil est refusé globalement ou par agent, la mise en sandbox ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors de la sandbox (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver strictement `exec`, utilisez la politique de refus des outils (voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode de sandbox effectif, la politique des outils et les clés de configuration correctives.
- Consultez [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi ceci est-il bloqué ? ».

Gardez-le verrouillé.

## Remplacements multi-agent

Chaque agent peut remplacer la sandbox et les outils : `agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique des outils de sandbox). Consultez [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) pour la précédence.

## Exemple d’activation minimal

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

## Associés

- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) — remplacements par agent et précédence
- [OpenShell](/fr/gateway/openshell) — configuration du backend de sandbox géré, modes d’espace de travail et référence de configuration
- [Configuration de sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage « pourquoi ceci est-il bloqué ? »
- [Sécurité](/fr/gateway/security)
