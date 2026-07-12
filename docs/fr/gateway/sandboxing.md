---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Fonctionnement du bac à sable d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Mise en bac à sable
x-i18n:
    generated_at: "2026-07-12T02:53:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw peut exécuter les outils dans un backend de bac à sable afin de réduire l’étendue des dommages potentiels. Le bac à sable est désactivé par défaut et contrôlé par `agents.defaults.sandbox` (globalement) ou `agents.list[].sandbox` (par agent). Le processus Gateway reste toujours sur l’hôte ; seule l’exécution des outils est déplacée dans le bac à sable lorsqu’il est activé.

<Note>
Il ne s’agit pas d’une frontière de sécurité parfaite, mais cela limite considérablement l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose d’inapproprié.
</Note>

## Éléments placés dans le bac à sable

- Exécution des outils : `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- Le navigateur facultatif placé dans le bac à sable (`agents.defaults.sandbox.browser`).

Ne sont pas placés dans le bac à sable :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du bac à sable via `tools.elevated`. L’exécution avec élévation contourne le bac à sable et utilise le chemin de sortie configuré (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Si le bac à sable est désactivé, `tools.elevated` ne change rien puisque l’exécution se déroule déjà sur l’hôte. Consultez le [mode avec élévation](/fr/tools/elevated).

## Modes, portée et backend

Trois paramètres indépendants contrôlent le comportement du bac à sable :

| Paramètre | Clé                               | Valeurs                      | Valeur par défaut |
| --------- | --------------------------------- | ---------------------------- | ----------------- |
| Mode      | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`             |
| Portée    | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`           |
| Backend   | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`          |

Le **mode** détermine quand le bac à sable s’applique :

- `off` : aucun bac à sable.
- `non-main` : place chaque session dans un bac à sable, sauf la session principale de l’agent. La clé de la session principale est toujours `agent:<agentId>:main` (ou `global` lorsque `session.scope` vaut `"global"`) ; elle n’est pas configurable. Les sessions de groupe ou de canal utilisent leurs propres clés ; elles sont donc toujours considérées comme non principales et placées dans un bac à sable.
- `all` : chaque session s’exécute dans un bac à sable.

La **portée** détermine le nombre de conteneurs ou d’environnements créés :

- `agent` : un conteneur par agent.
- `session` : un conteneur par session.
- `shared` : un conteneur partagé par toutes les sessions placées dans un bac à sable (les remplacements de `docker`/`ssh`/`browser` propres à chaque agent sont ignorés avec cette portée).

Le **backend** détermine quel environnement d’exécution exécute les outils placés dans le bac à sable. La configuration propre à SSH se trouve sous `agents.defaults.sandbox.ssh` ; celle propre à OpenShell se trouve sous `plugins.entries.openshell.config`.

|                                | Docker                               | SSH                                  | OpenShell                                                       |
| ------------------------------ | ------------------------------------ | ------------------------------------ | --------------------------------------------------------------- |
| **Lieu d’exécution**           | Conteneur local                      | Tout hôte accessible par SSH         | Bac à sable géré par OpenShell                                  |
| **Configuration**              | `scripts/sandbox-setup.sh`           | Clé SSH et hôte cible                | Plugin OpenShell activé                                         |
| **Modèle d’espace de travail** | Montage lié ou copie                 | Distant canonique (initialisé une fois) | `mirror` ou `remote`                                         |
| **Contrôle du réseau**         | `docker.network` (aucun par défaut)  | Dépend de l’hôte distant             | Dépend d’OpenShell                                              |
| **Navigateur en bac à sable**  | Pris en charge                       | Non pris en charge                   | Pas encore pris en charge                                      |
| **Montages liés**              | `docker.binds`                       | S/O                                  | S/O                                                             |
| **Idéal pour**                 | Développement local, isolation totale | Déport vers une machine distante     | Bacs à sable distants gérés avec synchronisation bidirectionnelle facultative |

## Backend Docker

Docker est le backend par défaut une fois le bac à sable activé. Il exécute les outils et les navigateurs en bac à sable localement par l’intermédiaire du socket du démon Docker (`/var/run/docker.sock`) ; l’isolation repose sur les espaces de noms Docker.

Valeurs par défaut : `network: "none"` (aucun trafic sortant), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Pour exposer les GPU de l’hôte, définissez `agents.defaults.sandbox.docker.gpus` (ou le remplacement propre à l’agent) sur une valeur telle que `"all"` ou `"device=GPU-uuid"`. Cette valeur est transmise à l’option `--gpus` de Docker et nécessite un environnement d’exécution hôte compatible, tel que NVIDIA Container Toolkit.

<Warning>
**Contraintes de Docker hors de Docker (DooD)**

Si vous déployez le Gateway OpenClaw lui-même dans un conteneur Docker, il orchestre des conteneurs de bac à sable frères à l’aide du socket Docker de l’hôte (DooD). Cela impose une contrainte de correspondance des chemins :

- **La configuration exige des chemins de l’hôte** : le champ `workspace` de `openclaw.json` doit contenir le **chemin absolu de l’hôte** (par exemple `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Le démon Docker évalue les chemins par rapport à l’espace de noms du système d’exploitation hôte, et non à celui du Gateway.
- **Une correspondance identique des volumes est requise** : le processus Gateway écrit également les fichiers de Heartbeat et de pont dans ce chemin `workspace`. Attribuez au conteneur Gateway une correspondance de volume identique (`-v /home/user/.openclaw:/home/user/.openclaw`) afin que le même chemin de l’hôte soit également résolu correctement depuis l’intérieur du conteneur Gateway. Des correspondances différentes provoquent une erreur `EACCES` lorsque le Gateway tente d’écrire son Heartbeat.
- **Mode code Codex** : lorsqu’un bac à sable OpenClaw est actif, OpenClaw désactive pour cette interaction le mode code natif du serveur d’application Codex, les serveurs MCP de l’utilisateur et l’exécution des plugins adossés à une application (ceux-ci s’exécutent depuis le processus du serveur d’application sur l’hôte du Gateway, et non depuis le backend de bac à sable OpenClaw), sauf si la politique d’outils du bac à sable expose les outils requis et si vous activez le chemin expérimental du serveur d’exécution dans le bac à sable. L’accès au shell passe alors par des outils OpenClaw adossés au bac à sable, tels que `sandbox_exec` et `sandbox_process`. Ne montez pas le socket Docker de l’hôte dans les conteneurs de bac à sable des agents ni dans des bacs à sable Codex personnalisés. Consultez le [harnais Codex](/fr/plugins/codex-harness) pour connaître le comportement complet.

Sur les hôtes Ubuntu/AppArmor où le mode de bac à sable Docker est activé, l’exécution du shell `workspace-write` du serveur d’application Codex nécessite des espaces de noms utilisateur non privilégiés dans le conteneur de bac à sable. Elle peut échouer avant le démarrage du shell lorsque l’utilisateur du service ne peut pas les créer. Un espace de noms réseau non privilégié est également nécessaire lorsque le trafic sortant du bac à sable Docker est désactivé (`network: "none"`, valeur par défaut). Symptômes courants : `bwrap: setting up uid map: Permission denied` et `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Exécutez `openclaw doctor` ; s’il signale l’échec d’une sonde d’espace de noms bwrap de Codex, privilégiez un profil AppArmor qui accorde les espaces de noms requis au processus du service OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` constitue une solution de secours à l’échelle de l’hôte, avec des compromis en matière de sécurité ; ne l’utilisez que si la posture de sécurité de cet hôte le permet.
</Warning>

### Navigateur en bac à sable

- Le navigateur en bac à sable démarre automatiquement (afin de garantir l’accessibilité de CDP) lorsque l’outil de navigation en a besoin. Configurez ce comportement avec `agents.defaults.sandbox.browser.autoStart` (`true` par défaut) et `autoStartTimeoutMs` (12 s par défaut).
- Les conteneurs du navigateur en bac à sable utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) plutôt que le réseau global `bridge`. Configurez-le avec `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` limite les connexions CDP entrantes à la périphérie du conteneur au moyen d’une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
- L’accès d’observation noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL à jeton de courte durée qui fournit une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment de l’URL (et non dans la chaîne de requête ni dans les journaux d’en-têtes).
- `agents.defaults.sandbox.browser.allowHostControl` (`false` par défaut) permet aux sessions placées dans un bac à sable de cibler explicitement le navigateur de l’hôte.
- Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Utilisez `backend: "ssh"` pour placer `exec`, les outils de fichiers et la lecture de médias dans un bac à sable sur une machine quelconque accessible par SSH.

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
          // Ou utilisez des SecretRefs / du contenu intégré au lieu de fichiers locaux :
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

- **Cycle de vie** : OpenClaw crée une racine distante propre à chaque portée sous `sandbox.ssh.workspaceRoot`. Lors de la première utilisation après sa création ou sa recréation, il initialise une fois cet espace de travail distant à partir de l’espace de travail local. Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, la lecture des médias de l’invite et la préparation des médias entrants s’exécutent directement dans l’espace de travail distant via SSH. OpenClaw ne synchronise pas automatiquement les modifications distantes vers l’espace de travail local.
- **Matériel d’authentification** : `identityFile`/`certificateFile`/`knownHostsFile` font référence à des fichiers locaux existants. `identityData`/`certificateData`/`knownHostsData` acceptent des chaînes intégrées ou des SecretRefs, résolues au moyen de l’instantané d’exécution habituel des secrets, écrites dans des fichiers temporaires avec le mode `0600`, puis supprimées à la fin de la session SSH. Si une variante `*File` et une variante `*Data` sont toutes deux définies pour le même élément, `*Data` prévaut pour cette session.
- **Conséquences du modèle distant canonique** : l’espace de travail SSH distant devient l’état réel du bac à sable après l’initialisation. Les modifications locales effectuées sur l’hôte en dehors d’OpenClaw après cette étape ne sont pas visibles à distance tant que vous ne recréez pas le bac à sable. `openclaw sandbox recreate` supprime la racine distante propre à la portée, puis la réinitialise depuis l’espace local lors de l’utilisation suivante. Le navigateur en bac à sable n’est pas pris en charge par ce backend, et les paramètres `sandbox.docker.*` ne s’y appliquent pas.

## Backend OpenShell

Utilisez `backend: "openshell"` pour placer les outils dans un bac à sable au sein d’un environnement distant géré par OpenShell. OpenShell réutilise le même transport SSH et le même pont de système de fichiers distant que le backend SSH générique, et y ajoute le cycle de vie OpenShell (`sandbox create/get/delete/ssh-config`) ainsi qu’un mode facultatif de synchronisation d’espace de travail `mirror`.

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

`mode: "mirror"` (valeur par défaut) conserve l’espace de travail local comme référence canonique : OpenClaw synchronise l’espace local vers le bac à sable avant `exec`, puis synchronise les modifications en retour après l’exécution. `mode: "remote"` initialise une fois l’espace de travail distant à partir de l’espace local, puis exécute `exec`/`read`/`write`/`edit`/`apply_patch` directement dans l’espace de travail distant sans synchronisation en retour ; les modifications locales effectuées après l’initialisation restent invisibles jusqu’à l’exécution de `openclaw sandbox recreate`. Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé selon la même portée. Limites actuelles : le navigateur en bac à sable n’est pas encore pris en charge et `sandbox.docker.binds` ne s’applique pas à ce backend.

`openclaw sandbox list`/`recreate`/prune traitent tous les environnements d’exécution OpenShell de la même manière que ceux de Docker ; la logique d’élagage tient compte du backend.

Pour connaître l’ensemble des prérequis, la référence de configuration, la comparaison des modes d’espace de travail et les détails du cycle de vie, consultez [OpenShell](/fr/gateway/openshell).

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` détermine ce que le bac à sable peut voir :

| Valeur           | Comportement                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `none` (par défaut) | Les outils voient un espace de travail isolé dans le bac à sable sous `~/.openclaw/sandboxes`.     |
| `ro`             | Monte l’espace de travail de l’agent en lecture seule dans `/agent` (désactive `write`/`edit`/`apply_patch`). |
| `rw`             | Monte l’espace de travail de l’agent en lecture-écriture dans `/workspace`.                           |

Avec le backend OpenShell, le mode `mirror` continue d’utiliser l’espace de travail local comme source canonique entre les exécutions, le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’initialisation, et `workspaceAccess: "ro"`/`"none"` continue de restreindre les écritures de la même manière.

Les médias entrants sont copiés dans l’espace de travail actif du bac à sable (`media/inbound/*`).

<Note>
**Skills** : l’outil `read` est limité à la racine du bac à sable. Avec `workspaceAccess: "none"`, OpenClaw réplique les Skills admissibles dans l’espace de travail du bac à sable (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis `/workspace/skills`, et les Skills admissibles gérés, intégrés ou provenant de Plugins sont matérialisés dans le chemin généré en lecture seule `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires supplémentaires de l’hôte dans le conteneur. Format : `host:container:mode` (par exemple, `"/home/user/source:/source:rw"`).

Les montages bind globaux et propres à chaque agent sont fusionnés (et non remplacés). Avec `scope: "shared"`, les montages bind propres à chaque agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires supplémentaires de l’hôte uniquement dans le conteneur du **navigateur du bac à sable**. Lorsque cette propriété est définie (y compris sur `[]`), elle remplace `docker.binds` pour le conteneur du navigateur ; lorsqu’elle est omise, le conteneur du navigateur utilise `docker.binds` par défaut.

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

- Les montages bind contournent le système de fichiers du bac à sable : ils exposent les chemins de l’hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque par défaut les sources de montage bind dangereuses : les chemins système (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), les répertoires de sockets Docker (`/run`, `/var/run` et leurs variantes `docker.sock`) ainsi que les répertoires racines courants contenant des identifiants dans le dossier personnel (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validation normalise le chemin source, puis le résout de nouveau à partir de l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées. Ainsi, les tentatives d’échappement par un parent symbolique sont refusées de manière sécurisée, même si l’élément final n’existe pas encore (par exemple, `/workspace/run-link/new-file` est toujours résolu en `/var/run/...` si `run-link` pointe vers cet emplacement).
- Les cibles de montage bind qui masquent les points de montage réservés du conteneur (`/workspace`, `/agent`) sont également bloquées par défaut ; utilisez `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` pour passer outre.
- Les sources de montage bind situées en dehors des racines autorisées de l’espace de travail ou de l’espace de travail de l’agent sont bloquées par défaut ; utilisez `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` pour passer outre. Les racines autorisées sont canonisées de la même manière : un chemin qui semble appartenir à la liste d’autorisation avant la résolution des liens symboliques est tout de même rejeté s’il se trouve en dehors des racines autorisées après résolution.
- Les montages sensibles (secrets, clés SSH, identifiants de services) doivent utiliser `:ro`, sauf nécessité absolue.
- Associez-les à `workspaceAccess: "ro"` si vous avez seulement besoin d’un accès en lecture à l’espace de travail ; les modes des montages bind restent indépendants.
- Consultez [Bac à sable, stratégie des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre l’interaction entre les montages bind, la stratégie des outils et l’exécution privilégiée.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Note>
**Extraction du code source ou installation npm**

Les scripts auxiliaires `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` et `scripts/sandbox-browser-setup.sh` sont disponibles uniquement lors d’une exécution depuis une [extraction du code source](https://github.com/openclaw/openclaw). Ils ne sont pas inclus dans le paquet npm.

Si vous avez installé OpenClaw avec `npm install -g openclaw`, utilisez plutôt les commandes `docker build` intégrées présentées ci-dessous.
</Note>

<Steps>
  <Step title="Créer l’image par défaut">
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

    L’image par défaut n’inclut **pas** Node. Si une Skill nécessite Node (ou d’autres environnements d’exécution), créez une image personnalisée qui les intègre ou installez-les avec `sandbox.docker.setupCommand` (nécessite un accès réseau sortant, une racine accessible en écriture et l’utilisateur root).

    OpenClaw ne remplace pas silencieusement l’image manquante `openclaw-sandbox:bookworm-slim` par une simple image `debian:bookworm-slim`. Les exécutions dans le bac à sable qui ciblent l’image par défaut échouent immédiatement en affichant une instruction de création tant que vous ne l’avez pas créée, car l’image intégrée contient `python3`, nécessaire aux outils d’écriture et de modification du bac à sable.

  </Step>
  <Step title="Facultatif : créer l’image commune">
    Pour disposer d’une image de bac à sable plus fonctionnelle avec des outils courants (par exemple `curl`, `jq`, Node 24, pnpm, `python3` et `git`) :

    Depuis une extraction du code source :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Depuis une installation npm, créez d’abord l’image par défaut (voir ci-dessus), puis créez l’image commune par-dessus à l’aide de [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) provenant du dépôt.

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facultatif : créer l’image du navigateur du bac à sable">
    Depuis une extraction du code source :

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Depuis une installation npm, créez l’image à l’aide de [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) provenant du dépôt.

  </Step>
</Steps>

Par défaut, les conteneurs Docker du bac à sable s’exécutent **sans réseau**. Utilisez `agents.defaults.sandbox.docker.network` pour modifier ce comportement.

<AccordionGroup>
  <Accordion title="Paramètres Chromium par défaut du navigateur du bac à sable">
    L’image intégrée du navigateur du bac à sable applique des options de démarrage Chromium prudentes pour les charges de travail conteneurisées :

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` par défaut ; ces options de renforcement graphique sont utiles pour les conteneurs sans prise en charge du GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D.
    - `--disable-extensions` par défaut ; définissez `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux qui dépendent d’extensions.
    - `--renderer-process-limit=2` par défaut ; contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un autre profil d’exécution, utilisez une image de navigateur personnalisée et fournissez votre propre point d’entrée. Pour les profils Chromium locaux (hors conteneur), utilisez `browser.extraArgs` afin d’ajouter des options de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Paramètres de sécurité réseau par défaut">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par rattachement à un espace de noms).
    - Dérogation d’urgence : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et le Gateway conteneurisé sont documentés ici : [Docker](/fr/install/docker)

Pour les déploiements du Gateway avec Docker, `scripts/docker/setup.sh` peut initialiser la configuration du bac à sable. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Modifiez l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence des variables d’environnement : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration ponctuelle du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur du bac à sable (et non à chaque exécution). Il s’exécute dans le conteneur avec `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Pièges courants">
    - La valeur par défaut de `docker.network` est `"none"` (aucun accès sortant), les installations de paquets échoueront donc.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et doit être réservé aux situations d’urgence.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou créez une image personnalisée.
    - `user` doit être root pour installer des paquets (omettez `user` ou définissez `user: "0:0"`).
    - L’exécution dans le bac à sable n’hérite **pas** de la variable `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés d’API des Skills.
    - Les valeurs de `agents.defaults.sandbox.docker.env` sont transmises comme variables d’environnement explicites du conteneur Docker. Toute personne ayant accès au démon Docker peut les consulter à l’aide de commandes de métadonnées Docker telles que `docker inspect`. Utilisez une image personnalisée, un fichier de secrets monté ou un autre mécanisme de transmission des secrets si cette exposition dans les métadonnées n’est pas acceptable.

  </Accordion>
</AccordionGroup>

## Stratégie des outils et échappatoires

Les stratégies d’autorisation et d’interdiction des outils s’appliquent toujours avant les règles du bac à sable. Si un outil est interdit globalement ou pour un agent, le bac à sable ne le réactive pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` en dehors du bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est `node`). Les directives `/exec` s’appliquent uniquement aux expéditeurs autorisés et persistent pendant toute la session ; pour désactiver complètement `exec`, utilisez une interdiction dans la stratégie des outils (consultez [Bac à sable, stratégie des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- `openclaw sandbox list` affiche les conteneurs du bac à sable, leur état, la correspondance de l’image, leur âge, leur durée d’inactivité et la session ou l’agent associé.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecte le mode effectif du bac à sable, l’espace de travail de l’hôte, le répertoire de travail d’exécution, les montages Docker, la stratégie des outils et les clés de configuration correctives. Son champ `workspaceRoot` reste la racine du bac à sable configurée ; `effectiveHostWorkspaceRoot` indique l’emplacement réel de l’espace de travail actif.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` supprime les conteneurs et les environnements afin qu’ils soient recréés avec la configuration actuelle lors de la prochaine utilisation.
- Consultez [Bac à sable, stratégie des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour comprendre pourquoi une opération est bloquée.

## Remplacements propres à chaque agent

Chaque agent peut remplacer la configuration du bac à sable et des outils : `agents.list[].sandbox` et `agents.list[].tools` (ainsi que `agents.list[].tools.sandbox.tools` pour la stratégie des outils du bac à sable). Consultez [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour connaître l’ordre de priorité.

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

## Ressources connexes

- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et ordre de priorité
- [OpenShell](/fr/gateway/openshell) -- configuration du moteur de bac à sable géré, modes d’espace de travail et référence de configuration
- [Configuration du bac à sable](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Bac à sable, politique des outils et mode privilégié](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- diagnostic de « pourquoi ceci est-il bloqué ? »
- [Sécurité](/fr/gateway/security)
