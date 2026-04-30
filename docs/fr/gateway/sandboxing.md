---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Fonctionnement du bac à sable d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Isolation en bac à sable
x-i18n:
    generated_at: "2026-04-30T07:29:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw peut exécuter des **outils dans des backends de sandbox** afin de réduire le rayon d’impact. C’est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte. Le Gateway reste sur l’hôte ; l’exécution des outils se fait dans une sandbox isolée lorsqu’elle est activée.

<Note>
Ce n’est pas une frontière de sécurité parfaite, mais cela limite concrètement l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose d’idiot.
</Note>

## Ce qui est sandboxé

- L’exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Le navigateur sandboxé facultatif (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Détails du navigateur sandboxé">
    - Par défaut, le navigateur de sandbox démarre automatiquement (ce qui garantit que CDP est accessible) lorsque l’outil navigateur en a besoin. Configurez ce comportement via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Par défaut, les conteneurs du navigateur de sandbox utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`. Configurez-le avec `agents.defaults.sandbox.browser.network`.
    - Le paramètre facultatif `agents.defaults.sandbox.browser.cdpSourceRange` restreint l’entrée CDP au bord du conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
    - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL de jeton à courte durée de vie qui sert une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux de requête ou d’en-tête).
    - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur de l’hôte.
    - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non sandboxés :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter en dehors de la sandbox (par exemple `tools.elevated`).
  - **L’exécution élevée contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Consultez [Mode élevé](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

<Tabs>
  <Tab title="off">
    Aucun sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox uniquement pour les sessions **non-main** (valeur par défaut si vous voulez que les conversations normales restent sur l’hôte).

    `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), et non sur l’identifiant de l’agent. Les sessions de groupe/canal utilisent leurs propres clés ; elles sont donc considérées comme non-main et seront sandboxées.

  </Tab>
  <Tab title="all">
    Chaque session s’exécute dans une sandbox.
  </Tab>
</Tabs>

## Portée

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions sandboxées.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit la sandbox :

- `"docker"` (par défaut lorsque le sandboxing est activé) : runtime de sandbox local basé sur Docker.
- `"ssh"` : runtime de sandbox distant générique basé sur SSH.
- `"openshell"` : runtime de sandbox basé sur OpenShell.

La configuration propre à SSH se trouve sous `agents.defaults.sandbox.ssh`. La configuration propre à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où il s’exécute** | Conteneur local                  | Tout hôte accessible par SSH   | Sandbox gérée par OpenShell                         |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle d’espace de travail** | Montage bind ou copie | Canonique distant (amorçage une fois) | `mirror` ou `remote`                         |
| **Contrôle réseau** | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant | Dépend d’OpenShell                                  |
| **Sandbox de navigateur** | Pris en charge             | Non pris en charge             | Pas encore pris en charge                           |
| **Montages bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Déchargement vers une machine distante | Sandboxes distantes gérées avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le sandboxing est désactivé par défaut. Si vous activez le sandboxing sans choisir de backend, OpenClaw utilise le backend Docker. Il exécute les outils et les navigateurs sandboxés localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation du conteneur de sandbox est déterminée par les namespaces Docker.

Pour exposer les GPU de l’hôte aux sandboxes Docker, définissez `agents.defaults.sandbox.docker.gpus` ou la substitution par agent `agents.list[].sandbox.docker.gpus`. La valeur est transmise à l’indicateur `--gpus` de Docker comme argument séparé, par exemple `"all"` ou `"device=GPU-uuid"`, et nécessite un runtime hôte compatible tel que NVIDIA Container Toolkit.

<Warning>
**Contraintes Docker-out-of-Docker (DooD)**

Si vous déployez le Gateway OpenClaw lui-même comme conteneur Docker, il orchestre les conteneurs de sandbox frères en utilisant le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemins :

- **La configuration exige des chemins hôte** : la configuration `workspace` de `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par exemple `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Lorsque OpenClaw demande au démon Docker de lancer une sandbox, le démon évalue les chemins par rapport à l’espace de noms de l’OS hôte, pas à celui du Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif du Gateway OpenClaw écrit aussi les fichiers Heartbeat et de pont dans le répertoire `workspace`. Comme le Gateway évalue exactement la même chaîne (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement du Gateway DOIT inclure un mappage de volume identique reliant nativement l’espace de noms de l’hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez les chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur d’autorisation `EACCES` lorsqu’il tente d’écrire son Heartbeat dans l’environnement du conteneur, car la chaîne de chemin pleinement qualifiée n’existe pas nativement.
</Warning>

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichiers et les lectures de médias sur une machine arbitraire accessible par SSH.

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
    - Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias de prompt et la mise en attente des médias entrants s’exécutent directement sur l’espace de travail distant via SSH.
    - OpenClaw ne synchronise pas automatiquement les changements distants vers l’espace de travail local.

  </Accordion>
  <Accordion title="Matériel d’authentification">
    - `identityFile`, `certificateFile`, `knownHostsFile` : utilisent les fichiers locaux existants et les transmettent via la configuration OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData` : utilisent des chaînes intégrées ou des SecretRefs. OpenClaw les résout via l’instantané normal du runtime de secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime à la fin de la session SSH.
    - Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

  </Accordion>
  <Accordion title="Conséquences du modèle canonique distant">
    Il s’agit d’un modèle **canonique distant**. L’espace de travail SSH distant devient l’état réel de la sandbox après l’amorçage initial.

    - Les modifications locales à l’hôte effectuées en dehors d’OpenClaw après l’étape d’amorçage ne sont pas visibles à distance tant que vous ne recréez pas la sandbox.
    - `openclaw sandbox recreate` supprime la racine distante par portée et réamorce depuis le local à l’utilisation suivante.
    - Le sandboxing de navigateur n’est pas pris en charge sur le backend SSH.
    - Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un environnement distant géré par OpenShell. Pour le guide de configuration complet, la référence de configuration et la comparaison des modes d’espace de travail, consultez la [page OpenShell dédiée](/fr/gateway/openshell).

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

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux vers OpenShell avant `exec` et resynchronise l’espace de travail distant après `exec`.
- `remote` : l’espace de travail OpenShell est canonique après la création de la sandbox. OpenClaw amorce l’espace de travail distant une fois depuis l’espace de travail local, puis les outils de fichiers et `exec` s’exécutent directement sur la sandbox distante sans resynchroniser les changements.

<AccordionGroup>
  <Accordion title="Détails du transport distant">
    - OpenClaw demande à OpenShell une configuration SSH propre à la sandbox via `openshell sandbox ssh-config <name>`.
    - Le cœur écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH, puis réutilise le même pont de système de fichiers distant que celui utilisé par `backend: "ssh"`.
    - En mode `mirror`, seul le cycle de vie diffère : synchronisation du local vers le distant avant `exec`, puis resynchronisation après `exec`.

  </Accordion>
  <Accordion title="Limites actuelles d’OpenShell">
    - le navigateur de sandbox n’est pas encore pris en charge
    - `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
    - les réglages de runtime propres à Docker sous `sandbox.docker.*` s’appliquent toujours uniquement au backend Docker

  </Accordion>
</AccordionGroup>

#### Modes d’espace de travail

OpenShell propose deux modèles d’espace de travail. C’est la partie qui compte le plus en pratique.

<Tabs>
  <Tab title="mirror (canonique local)">
    Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local reste canonique**.

    Comportement :

    - Avant `exec`, OpenClaw synchronise l’espace de travail local vers la sandbox OpenShell.
    - Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’espace de travail local.
    - Les outils de fichiers continuent de passer par le pont de sandbox, mais l’espace de travail local reste la source de vérité entre les tours.

    Utilisez ceci lorsque :

    - vous modifiez des fichiers localement hors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le bac à sable
    - vous voulez que le bac à sable OpenShell se comporte autant que possible comme le backend Docker
    - vous voulez que l’espace de travail hôte reflète les écritures du bac à sable après chaque tour d’exécution

    Compromis : coût de synchronisation supplémentaire avant et après l’exécution.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell devienne canonique**.

    Comportement :

    - Lorsque le bac à sable est créé pour la première fois, OpenClaw initialise une fois l’espace de travail distant à partir de l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit` et `apply_patch` opèrent directement sur l’espace de travail OpenShell distant.
    - OpenClaw ne synchronise **pas** les changements distants vers l’espace de travail local après l’exécution.
    - Les lectures de médias au moment du prompt fonctionnent toujours, car les outils de fichiers et de médias passent par le pont du bac à sable au lieu de supposer un chemin d’hôte local.
    - Le transport se fait en SSH vers le bac à sable OpenShell renvoyé par `openshell sandbox ssh-config`.

    Conséquences importantes :

    - Si vous modifiez des fichiers sur l’hôte hors d’OpenClaw après l’étape d’initialisation, le bac à sable distant ne verra **pas** ces changements automatiquement.
    - Si le bac à sable est recréé, l’espace de travail distant est de nouveau initialisé à partir de l’espace de travail local.
    - Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à cette même portée.

    Utilisez ceci lorsque :

    - le bac à sable doit vivre principalement côté OpenShell distant
    - vous voulez réduire le surcoût de synchronisation par tour
    - vous ne voulez pas que des modifications locales à l’hôte écrasent silencieusement l’état du bac à sable distant

  </Tab>
</Tabs>

Choisissez `mirror` si vous considérez le bac à sable comme un environnement d’exécution temporaire. Choisissez `remote` si vous considérez le bac à sable comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les bacs à sable OpenShell sont toujours gérés via le cycle de vie normal des bacs à sable :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer à la prochaine utilisation
- la logique de purge tient aussi compte du backend

Pour le mode `remote`, la recréation est particulièrement importante :

- recréer supprime l’espace de travail distant canonique pour cette portée
- l’utilisation suivante initialise un nouvel espace de travail distant à partir de l’espace de travail local

Pour le mode `mirror`, recréer réinitialise surtout l’environnement d’exécution distant, car l’espace de travail local reste canonique dans tous les cas.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le bac à sable peut voir** :

<Tabs>
  <Tab title="none (default)">
    Les outils voient un espace de travail de bac à sable sous `~/.openclaw/sandboxes`.
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

Les médias entrants sont copiés dans l’espace de travail actif du bac à sable (`media/inbound/*`).

<Note>
**Remarque Skills :** l’outil `read` est enraciné dans le bac à sable. Avec `workspaceAccess: "none"`, OpenClaw réplique les Skills éligibles dans l’espace de travail du bac à sable (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis `/workspace/skills`.
</Note>

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôtes supplémentaires dans le conteneur. Format : `host:container:mode` (par exemple, `"/home/user/source:/source:rw"`).

Les montages bind globaux et propres à chaque agent sont **fusionnés** (et non remplacés). Sous `scope: "shared"`, les montages bind propres à chaque agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur du **navigateur de bac à sable**.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur du navigateur.
- Lorsqu’il est omis, le conteneur du navigateur se rabat sur `agents.defaults.sandbox.docker.binds` (rétrocompatible).

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

<Warning>
**Sécurité des montages bind**

- Les montages bind contournent le système de fichiers du bac à sable : ils exposent des chemins hôtes avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de montage bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines courantes d’identifiants de répertoire personnel, telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` et `~/.ssh`.
- La validation des montages bind n’est pas une simple correspondance de chaînes. OpenClaw normalise le chemin source, puis le résout de nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappements via parent symbolique échouent toujours de façon fermée, même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout toujours comme `/var/run/...` si `run-link` pointe là-bas.
- Les racines sources autorisées sont canonisées de la même manière, donc un chemin qui semble seulement appartenir à la liste d’autorisation avant la résolution des liens symboliques est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro` sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous avez seulement besoin d’un accès en lecture à l’espace de travail ; les modes de montage bind restent indépendants.
- Consultez [Bac à sable vs politique d’outils vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour savoir comment les montages bind interagissent avec la politique d’outils et l’exécution élevée.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    L’image par défaut n’inclut **pas** Node. Si une Skill a besoin de Node (ou d’autres runtimes), intégrez-le dans une image personnalisée ou installez-le via `sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible + l’utilisateur root).

    OpenClaw ne remplace pas silencieusement par `debian:bookworm-slim` lorsque `openclaw-sandbox:bookworm-slim` manque. Les exécutions de bac à sable qui ciblent l’image par défaut échouent rapidement avec une instruction de construction jusqu’à ce que vous exécutiez `scripts/sandbox-setup.sh`, car l’image fournie embarque `python3` pour les assistants d’écriture/modification du bac à sable.

  </Step>
  <Step title="Optional: build the common image">
    Pour une image de bac à sable plus fonctionnelle avec des outils courants (par exemple `curl`, `jq`, `nodejs`, `python3`, `git`) :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Par défaut, les conteneurs de bac à sable Docker s’exécutent avec **aucun réseau**. Remplacez ce comportement avec `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    L’image de navigateur de bac à sable fournie applique aussi des valeurs par défaut de démarrage Chromium conservatrices pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

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
    - Les trois indicateurs de renforcement graphique (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles lorsque les conteneurs ne disposent pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/de navigateur.
    - `--disable-extensions` est activé par défaut et peut être désactivé avec `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendants des extensions.
    - `--renderer-process-limit=2` est contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un profil de runtime différent, utilisez une image de navigateur personnalisée et fournissez votre propre point d’entrée. Pour les profils Chromium locaux (non conteneurisés), utilisez `browser.extraArgs` pour ajouter des indicateurs de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par jointure d’espace de noms).
    - Contournement d’urgence : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et le Gateway conteneurisé se trouvent ici : [Docker](/fr/install/docker)

Pour les déploiements de Gateway Docker, `scripts/docker/setup.sh` peut initialiser la configuration du bac à sable. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence des variables d’environnement : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration unique du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur de bac à sable (pas à chaque exécution). Elle s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - La valeur par défaut de `docker.network` est `"none"` (aucune sortie), donc les installations de paquets échoueront.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et doit être réservé aux situations d’urgence.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
    - `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
    - L’exécution dans le bac à sable n’hérite **pas** de `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés d’API des Skills.

  </Accordion>
</AccordionGroup>

## Politique d’outils et échappatoires

Les politiques d’autorisation/refus d’outils s’appliquent toujours avant les règles de bac à sable. Si un outil est refusé globalement ou par agent, le bac à sable ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors du bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver strictement `exec`, utilisez un refus dans la politique d’outils (voir [Bac à sable vs politique d’outils vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode de bac à sable effectif, la politique d’outils et les clés de configuration correctives.
- Consultez [Bac à sable vs politique d’outils vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi ceci est-il bloqué ? ».

Gardez-le verrouillé.

## Remplacements multi-agents

Chaque agent peut remplacer le bac à sable + les outils : `agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique d’outils du bac à sable). Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour la précédence.

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

## Associé

- [Bac à sable multi-agent et outils](/fr/tools/multi-agent-sandbox-tools) — remplacements par agent et précédence
- [OpenShell](/fr/gateway/openshell) — configuration du backend de bac à sable géré, modes d’espace de travail et référence de configuration
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable vs stratégie d’outils vs élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — débogage de « pourquoi est-ce bloqué ? »
- [Sécurité](/fr/gateway/security)
