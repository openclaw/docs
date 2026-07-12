---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Fonctionnement du sandboxing d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Mise en bac à sable
x-i18n:
    generated_at: "2026-07-12T15:22:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw peut exécuter les outils dans un environnement backend isolé afin de réduire l’impact potentiel. L’isolation est désactivée par défaut et contrôlée par `agents.defaults.sandbox` (globalement) ou `agents.list[].sandbox` (par agent). Le processus Gateway reste toujours sur l’hôte ; seule l’exécution des outils est transférée dans l’environnement isolé lorsqu’elle est activée.

<Note>
Il ne s’agit pas d’une frontière de sécurité parfaite, mais elle limite considérablement l’accès au système de fichiers et aux processus lorsque le modèle commet une erreur.
</Note>

## Éléments isolés

- Exécution des outils : `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- Le navigateur isolé facultatif (`agents.defaults.sandbox.browser`).

Éléments non isolés :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors de l’environnement isolé via `tools.elevated`. Une exécution avec élévation contourne l’isolation et s’effectue sur le chemin de sortie configuré (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Si l’isolation est désactivée, `tools.elevated` ne change rien puisque l’exécution s’effectue déjà sur l’hôte. Consultez le [mode avec élévation](/fr/tools/elevated).

## Modes, portée et backend

Trois paramètres indépendants contrôlent le comportement de l’isolation :

| Paramètre | Clé                               | Valeurs                      | Valeur par défaut |
| --------- | --------------------------------- | ---------------------------- | ----------------- |
| Mode      | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`             |
| Portée    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`           |
| Backend   | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`          |

Le **mode** détermine quand l’isolation s’applique :

- `off` : aucune isolation.
- `non-main` : isole toutes les sessions à l’exception de la session principale de l’agent. La clé de la session principale est toujours `agent:<agentId>:main` (ou `global` lorsque `session.scope` vaut `"global"`) ; elle n’est pas configurable. Les sessions de groupe ou de canal utilisent leurs propres clés : elles sont donc toujours considérées comme secondaires et sont isolées.
- `all` : chaque session s’exécute dans un environnement isolé.

La **portée** détermine le nombre de conteneurs ou d’environnements créés :

- `agent` : un conteneur par agent.
- `session` : un conteneur par session.
- `shared` : un conteneur partagé par toutes les sessions isolées (les remplacements de `docker`/`ssh`/`browser` propres à chaque agent sont ignorés avec cette portée).

Le **backend** détermine quel environnement d’exécution exécute les outils isolés. La configuration propre à SSH se trouve sous `agents.defaults.sandbox.ssh` ; celle d’OpenShell se trouve sous `plugins.entries.openshell.config`.

|                              | Docker                              | SSH                                 | OpenShell                                                      |
| ---------------------------- | ----------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| **Lieu d’exécution**         | Conteneur local                     | Tout hôte accessible par SSH        | Environnement isolé géré par OpenShell                         |
| **Configuration**            | `scripts/sandbox-setup.sh`          | Clé SSH + hôte cible                | Plugin OpenShell activé                                        |
| **Modèle d’espace de travail** | Montage lié ou copie                | Distant canonique (initialisé une fois) | `mirror` ou `remote`                                       |
| **Contrôle du réseau**       | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant            | Dépend d’OpenShell                                             |
| **Navigateur isolé**         | Pris en charge                      | Non pris en charge                  | Pas encore pris en charge                                      |
| **Montages liés**            | `docker.binds`                      | N/A                                 | N/A                                                            |
| **Idéal pour**               | Développement local, isolation complète | Délégation à une machine distante | Environnements isolés distants gérés avec synchronisation bidirectionnelle facultative |

## Backend Docker

Docker est le backend par défaut lorsque l’isolation est activée. Il exécute localement les outils et les navigateurs isolés par l’intermédiaire du socket du démon Docker (`/var/run/docker.sock`) ; l’isolation repose sur les espaces de noms Docker.

Valeurs par défaut : `network: "none"` (aucun trafic sortant), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Pour exposer les GPU de l’hôte, définissez `agents.defaults.sandbox.docker.gpus` (ou le remplacement propre à l’agent) sur une valeur telle que `"all"` ou `"device=GPU-uuid"`. Cette valeur est transmise à l’option `--gpus` de Docker et nécessite un environnement d’exécution hôte compatible, tel que NVIDIA Container Toolkit.

<Warning>
**Contraintes de Docker-out-of-Docker (DooD)**

Si vous déployez le Gateway OpenClaw lui-même sous forme de conteneur Docker, il orchestre les conteneurs isolés voisins à l’aide du socket Docker de l’hôte (DooD). Cela impose une contrainte de correspondance des chemins :

- **La configuration exige des chemins de l’hôte** : le champ `workspace` de `openclaw.json` doit contenir le **chemin absolu sur l’hôte** (par exemple `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Le démon Docker évalue les chemins relativement à l’espace de noms du système d’exploitation hôte, et non à celui du Gateway.
- **Une correspondance identique des volumes est requise** : le processus Gateway écrit également des fichiers de Heartbeat et de pont dans ce chemin `workspace`. Fournissez au conteneur Gateway une correspondance de volume identique (`-v /home/user/.openclaw:/home/user/.openclaw`) afin que le même chemin de l’hôte soit aussi correctement résolu depuis le conteneur Gateway. Des correspondances divergentes provoquent une erreur `EACCES` lorsque le Gateway tente d’écrire son Heartbeat.
- **Mode code de Codex** : lorsqu’un environnement isolé OpenClaw est actif, OpenClaw désactive pour ce tour le mode code natif du serveur d’application Codex, les serveurs MCP de l’utilisateur et l’exécution des plugins adossés à une application (ceux-ci s’exécutent depuis le processus du serveur d’application sur l’hôte du Gateway, et non dans le backend isolé OpenClaw), sauf si la politique d’outils de l’environnement isolé expose les outils requis et que vous activez le chemin expérimental du serveur d’exécution isolé. L’accès à l’interpréteur de commandes passe alors par des outils adossés à l’environnement isolé OpenClaw, tels que `sandbox_exec` et `sandbox_process`. Ne montez pas le socket Docker de l’hôte dans les conteneurs isolés des agents ni dans des environnements isolés Codex personnalisés. Consultez le [harnais Codex](/fr/plugins/codex-harness) pour connaître le comportement complet.

Sur les hôtes Ubuntu/AppArmor où le mode d’isolation Docker est activé, l’exécution de l’interpréteur de commandes avec `workspace-write` par le serveur d’application Codex nécessite des espaces de noms utilisateur non privilégiés dans le conteneur isolé ; elle peut échouer avant le démarrage de l’interpréteur si l’utilisateur du service ne peut pas les créer. Un espace de noms réseau non privilégié est également nécessaire lorsque le trafic sortant de l’environnement isolé Docker est désactivé (`network: "none"`, valeur par défaut). Symptômes courants : `bwrap: setting up uid map: Permission denied` et `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Exécutez `openclaw doctor` ; s’il signale l’échec d’une vérification des espaces de noms bwrap de Codex, privilégiez un profil AppArmor qui accorde les espaces de noms requis au processus de service OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` constitue une solution de repli à l’échelle de l’hôte, avec des compromis en matière de sécurité ; ne l’utilisez que si la posture de sécurité de cet hôte l’autorise.
</Warning>

### Navigateur isolé

- Le navigateur isolé démarre automatiquement (pour garantir que CDP est accessible) lorsque l’outil de navigation en a besoin. Configurez ce comportement avec `agents.defaults.sandbox.browser.autoStart` (valeur par défaut : `true`) et `autoStartTimeoutMs` (valeur par défaut : 12s).
- Les conteneurs du navigateur isolé utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) plutôt que le réseau global `bridge`. Configurez-le avec `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` limite le trafic CDP entrant à la périphérie du conteneur au moyen d’une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
- L’accès d’observation noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL avec un jeton de courte durée, qui fournit une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (et non dans la chaîne de requête ni dans les journaux d’en-têtes).
- `agents.defaults.sandbox.browser.allowHostControl` (valeur par défaut : `false`) permet aux sessions isolées de cibler explicitement le navigateur de l’hôte.
- Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Utilisez `backend: "ssh"` pour isoler `exec`, les outils de fichiers et les lectures de médias sur une machine arbitraire accessible par SSH.

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
          // Ou utilisez des SecretRefs ou du contenu intégré à la place de fichiers locaux :
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Valeurs par défaut : `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Cycle de vie** : OpenClaw crée une racine distante propre à chaque portée sous `sandbox.ssh.workspaceRoot`. Lors de la première utilisation après sa création ou sa recréation, il initialise une fois cet espace de travail distant à partir de l’espace de travail local. Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures de médias des prompts et la préparation des médias entrants s’effectuent directement sur l’espace de travail distant par SSH. OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.
- **Matériel d’authentification** : `identityFile`/`certificateFile`/`knownHostsFile` font référence à des fichiers locaux existants. `identityData`/`certificateData`/`knownHostsData` acceptent des chaînes intégrées ou des SecretRefs, résolues au moyen de l’instantané normal de l’environnement d’exécution des secrets, écrites dans des fichiers temporaires avec le mode `0600`, puis supprimées à la fin de la session SSH. Si une variante `*File` et une variante `*Data` sont toutes deux définies pour le même élément, `*Data` l’emporte pour cette session.
- **Conséquences du modèle distant canonique** : après l’initialisation, l’espace de travail SSH distant devient l’état réel de l’environnement isolé. Les modifications locales apportées sur l’hôte hors d’OpenClaw après l’étape d’initialisation ne sont pas visibles à distance tant que vous ne recréez pas l’environnement isolé. `openclaw sandbox recreate` supprime la racine distante propre à la portée et l’initialise à nouveau à partir de l’espace local lors de l’utilisation suivante. L’isolation du navigateur n’est pas prise en charge par ce backend, et les paramètres `sandbox.docker.*` ne s’y appliquent pas.

## Backend OpenShell

Utilisez `backend: "openshell"` pour isoler les outils dans un environnement distant géré par OpenShell. OpenShell réutilise le même transport SSH et le même pont de système de fichiers distant que le backend SSH générique, et ajoute le cycle de vie OpenShell (`sandbox create/get/delete/ssh-config`) ainsi qu’un mode facultatif de synchronisation de l’espace de travail `mirror`.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (valeur par défaut) conserve l’espace de travail local comme source canonique : OpenClaw synchronise le contenu local vers l’environnement isolé avant `exec`, puis le resynchronise après. `mode: "remote"` initialise une fois l’espace de travail distant à partir de l’espace local, puis exécute directement `exec`/`read`/`write`/`edit`/`apply_patch` sur l’espace de travail distant sans resynchronisation ; les modifications locales postérieures à l’initialisation restent invisibles jusqu’à l’exécution de `openclaw sandbox recreate`. Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à la même portée. Limitations actuelles : le navigateur isolé n’est pas encore pris en charge et `sandbox.docker.binds` ne s’applique pas à ce backend.

`openclaw sandbox list`/`recreate`/prune traitent tous les environnements d’exécution OpenShell comme ceux de Docker ; la logique d’élagage tient compte du backend.

Pour connaître l’ensemble des prérequis, la référence de configuration, la comparaison des modes d’espace de travail et les détails du cycle de vie, consultez [OpenShell](/fr/gateway/openshell).

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle ce que l’environnement isolé peut voir :

| Valeur           | Comportement                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `none` (défaut)  | Les outils voient un espace de travail de bac à sable isolé sous `~/.openclaw/sandboxes`.                          |
| `ro`             | Monte l’espace de travail de l’agent en lecture seule dans `/agent` (désactive `write`/`edit`/`apply_patch`).       |
| `rw`             | Monte l’espace de travail de l’agent en lecture/écriture dans `/workspace`.                                        |

Avec le backend OpenShell, le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les exécutions, le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’initialisation, et `workspaceAccess: "ro"`/`"none"` restreint toujours l’écriture de la même manière.

Les médias entrants sont copiés dans l’espace de travail du bac à sable actif (`media/inbound/*`).

<Note>
**Skills** : l’outil `read` est ancré à la racine du bac à sable. Avec `workspaceAccess: "none"`, OpenClaw met en miroir les Skills éligibles dans l’espace de travail du bac à sable (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis `/workspace/skills`, et les Skills gérés, intégrés ou de Plugin éligibles sont matérialisés dans le chemin généré en lecture seule `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montages liés personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôtes supplémentaires dans le conteneur. Format : `host:container:mode` (par exemple, `"/home/user/source:/source:rw"`).

Les montages liés globaux et propres à chaque agent sont fusionnés (et non remplacés). Avec `scope: "shared"`, les montages liés propres à chaque agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôtes supplémentaires uniquement dans le conteneur du **navigateur du bac à sable**. Lorsqu’il est défini (y compris sur `[]`), il remplace `docker.binds` pour le conteneur du navigateur ; lorsqu’il est omis, le conteneur du navigateur utilise `docker.binds` comme solution de repli.

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
**Sécurité des montages liés**

- Les montages liés contournent le système de fichiers du bac à sable : ils exposent les chemins de l’hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque par défaut les sources de montage lié dangereuses : chemins système (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), répertoires de sockets Docker (`/run`, `/var/run` et leurs variantes `docker.sock`) et racines courantes d’identifiants dans le répertoire personnel (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validation normalise le chemin source, puis le résout de nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées. Ainsi, les échappements via un parent symbolique échouent de manière fermée, même si l’élément final n’existe pas encore (par exemple, `/workspace/run-link/new-file` est toujours résolu en `/var/run/...` si `run-link` pointe vers cet emplacement).
- Les cibles de montage lié qui masquent les points de montage réservés du conteneur (`/workspace`, `/agent`) sont également bloquées par défaut ; remplacez ce comportement avec `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Les sources de montage lié situées en dehors des racines autorisées de l’espace de travail ou de l’espace de travail de l’agent sont bloquées par défaut ; remplacez ce comportement avec `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Les racines autorisées sont canonisées de la même manière : un chemin qui semble se trouver dans la liste autorisée avant la résolution des liens symboliques est donc tout de même rejeté s’il se situe en dehors des racines autorisées après résolution.
- Les montages sensibles (secrets, clés SSH, identifiants de service) doivent être en `:ro`, sauf nécessité absolue.
- Combinez-les avec `workspaceAccess: "ro"` si vous avez uniquement besoin d’un accès en lecture à l’espace de travail ; les modes des montages liés restent indépendants.
- Consultez [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre comment les montages liés interagissent avec la politique des outils et l’exécution en mode élevé.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Note>
**Extraction du code source ou installation npm**

Les scripts auxiliaires `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` et `scripts/sandbox-browser-setup.sh` sont uniquement disponibles lors d’une exécution depuis une [extraction du code source](https://github.com/openclaw/openclaw). Ils ne sont pas inclus dans le paquet npm.

Si vous avez installé OpenClaw via `npm install -g openclaw`, utilisez plutôt les commandes `docker build` intégrées présentées ci-dessous.
</Note>

<Steps>
  <Step title="Construire l’image par défaut">
    Depuis une extraction du code source :

    ```bash
    scripts/sandbox-setup.sh
    ```

    Depuis une installation npm (aucune extraction du code source nécessaire) :

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

    L’image par défaut n’inclut **pas** Node. Si une Skill nécessite Node (ou d’autres environnements d’exécution), créez une image personnalisée qui les intègre ou installez-les via `sandbox.docker.setupCommand` (nécessite un accès réseau sortant, une racine accessible en écriture et l’utilisateur root).

    OpenClaw ne remplace pas silencieusement l’image manquante `openclaw-sandbox:bookworm-slim` par l’image ordinaire `debian:bookworm-slim`. Les exécutions en bac à sable qui ciblent l’image par défaut échouent immédiatement avec une instruction de construction jusqu’à ce que vous la construisiez, car l’image intégrée contient `python3` pour les outils auxiliaires d’écriture et de modification du bac à sable.

  </Step>
  <Step title="Facultatif : construire l’image commune">
    Pour une image de bac à sable plus fonctionnelle comportant des outils courants (par exemple `curl`, `jq`, Node 24, pnpm, `python3` et `git`) :

    Depuis une extraction du code source :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Depuis une installation npm, construisez d’abord l’image par défaut (voir ci-dessus), puis construisez l’image commune par-dessus à l’aide de [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) depuis le dépôt.

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facultatif : construire l’image du navigateur du bac à sable">
    Depuis une extraction du code source :

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Depuis une installation npm, construisez l’image à l’aide de [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) depuis le dépôt.

  </Step>
</Steps>

Par défaut, les conteneurs Docker du bac à sable s’exécutent **sans réseau**. Remplacez ce comportement avec `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valeurs par défaut de Chromium dans le navigateur du bac à sable">
    L’image intégrée du navigateur du bac à sable applique des indicateurs de démarrage Chromium prudents pour les charges de travail conteneurisées :

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` lorsque `browser.headless` est activé.
    - `--no-sandbox --disable-setuid-sandbox` lorsque `browser.noSandbox` est activé.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` par défaut ; ces indicateurs de renforcement graphique sont utiles pour les conteneurs sans prise en charge du GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D.
    - `--disable-extensions` par défaut ; définissez `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux qui dépendent d’extensions.
    - `--renderer-process-limit=2` par défaut ; contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un profil d’exécution différent, utilisez une image de navigateur personnalisée et fournissez votre propre point d’entrée. Pour les profils Chromium locaux (hors conteneur), utilisez `browser.extraArgs` afin d’ajouter des indicateurs de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Paramètres de sécurité réseau par défaut">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par rattachement à un espace de noms).
    - Remplacement d’urgence : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et le Gateway conteneurisé sont décrits ici : [Docker](/fr/install/docker)

Pour les déploiements du Gateway avec Docker, `scripts/docker/setup.sh` peut initialiser la configuration du bac à sable. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Remplacez l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence des variables d’environnement : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration ponctuelle du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur du bac à sable (et non à chaque exécution). Il s’exécute dans le conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Pièges courants">
    - La valeur par défaut de `docker.network` est `"none"` (aucun accès sortant) ; les installations de paquets échoueront donc.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et doit uniquement servir de mécanisme d’urgence.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou créez une image personnalisée qui les intègre.
    - `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
    - L’exécution dans le bac à sable n’hérite **pas** de la valeur `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés d’API des Skills.
    - Les valeurs de `agents.defaults.sandbox.docker.env` sont transmises comme variables d’environnement explicites du conteneur Docker. Toute personne disposant d’un accès au démon Docker peut les consulter avec des commandes de métadonnées Docker telles que `docker inspect`. Utilisez une image personnalisée, un fichier de secrets monté ou un autre mécanisme de transmission des secrets si cette exposition dans les métadonnées n’est pas acceptable.

  </Accordion>
</AccordionGroup>

## Politique des outils et mécanismes d’échappement

Les politiques d’autorisation et de refus des outils s’appliquent toujours avant les règles du bac à sable. Si un outil est refusé globalement ou pour un agent donné, l’exécution en bac à sable ne le réactive pas.

`tools.elevated` est un mécanisme d’échappement explicite qui exécute `exec` en dehors du bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Les directives `/exec` s’appliquent uniquement aux expéditeurs autorisés et persistent pendant toute la session ; pour désactiver complètement `exec`, utilisez le refus de la politique des outils (voir [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- `openclaw sandbox list` affiche les conteneurs du bac à sable, leur état, la correspondance de l’image, leur âge, leur durée d’inactivité et la session ou l’agent associé.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` examine le mode de bac à sable effectif, l’espace de travail hôte, le répertoire de travail d’exécution, les montages Docker, la politique des outils et les clés de configuration correctives. Son champ `workspaceRoot` reste la racine configurée du bac à sable ; `effectiveHostWorkspaceRoot` indique l’emplacement réel de l’espace de travail actif.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` supprime les conteneurs ou environnements afin qu’ils soient recréés avec la configuration actuelle lors de la prochaine utilisation.
- Consultez [Bac à sable, politique des outils et mode élevé](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre pourquoi un élément est bloqué.

## Remplacements pour plusieurs agents

Chaque agent peut remplacer la configuration du bac à sable et des outils : `agents.list[].sandbox` et `agents.list[].tools` (ainsi que `agents.list[].tools.sandbox.tools` pour la politique des outils du bac à sable). Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour connaître l’ordre de priorité.

## Exemple d’activation minimale

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

## Contenu associé

- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- dérogations par agent et ordre de priorité
- [OpenShell](/fr/gateway/openshell) -- configuration du backend de bac à sable géré, modes d’espace de travail et référence de configuration
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable, politique des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- diagnostic de « pourquoi ceci est-il bloqué ? »
- [Sécurité](/fr/gateway/security)
