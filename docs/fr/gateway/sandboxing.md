---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Comment fonctionne le sandboxing d’OpenClaw : modes, portées, accès à l’espace de travail et images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw peut exécuter des **outils à l’intérieur de backends sandbox** afin de réduire le rayon d’impact. Cela est **facultatif** et contrôlé par la configuration (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Si le sandboxing est désactivé, les outils s’exécutent sur l’hôte. La Gateway reste sur l’hôte ; l’exécution des outils se fait dans un sandbox isolé lorsqu’il est activé.

<Note>
Ce n’est pas une frontière de sécurité parfaite, mais cela limite matériellement l’accès au système de fichiers et aux processus lorsque le modèle fait quelque chose de stupide.
</Note>

## Ce qui est sandboxé

- Exécution des outils (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navigateur sandboxé facultatif (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Détails du navigateur sandboxé">
    - Par défaut, le navigateur sandboxé démarre automatiquement (garantit que CDP est joignable) lorsque l’outil navigateur en a besoin. Configurez cela via `agents.defaults.sandbox.browser.autoStart` et `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Par défaut, les conteneurs du navigateur sandboxé utilisent un réseau Docker dédié (`openclaw-sandbox-browser`) au lieu du réseau global `bridge`. Configurez cela avec `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` facultatif restreint l’entrée CDP en bordure de conteneur avec une liste d’autorisation CIDR (par exemple `172.21.0.1/32`).
    - L’accès observateur noVNC est protégé par mot de passe par défaut ; OpenClaw émet une URL à token de courte durée qui sert une page d’amorçage locale et ouvre noVNC avec le mot de passe dans le fragment d’URL (pas dans les journaux query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` permet aux sessions sandboxées de cibler explicitement le navigateur de l’hôte.
    - Des listes d’autorisation facultatives contrôlent `target: "custom"` : `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non sandboxé :

- Le processus Gateway lui-même.
- Tout outil explicitement autorisé à s’exécuter hors du sandbox (par ex. `tools.elevated`).
  - **`exec` élevé contourne le sandboxing et utilise le chemin d’échappement configuré (`gateway` par défaut, ou `node` lorsque la cible `exec` est `node`).**
  - Si le sandboxing est désactivé, `tools.elevated` ne change pas l’exécution (déjà sur l’hôte). Voir [Mode Elevated](/fr/tools/elevated).

## Modes

`agents.defaults.sandbox.mode` contrôle **quand** le sandboxing est utilisé :

<Tabs>
  <Tab title="off">
    Pas de sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandboxer uniquement les sessions **non principales** (par défaut si vous voulez des discussions normales sur l’hôte).

    `"non-main"` est basé sur `session.mainKey` (par défaut `"main"`), pas sur l’id d’agent. Les sessions de groupe/canal utilisent leurs propres clés, donc elles comptent comme non principales et seront sandboxées.

  </Tab>
  <Tab title="all">
    Chaque session s’exécute dans un sandbox.
  </Tab>
</Tabs>

## Portée

`agents.defaults.sandbox.scope` contrôle **combien de conteneurs** sont créés :

- `"agent"` (par défaut) : un conteneur par agent.
- `"session"` : un conteneur par session.
- `"shared"` : un conteneur partagé par toutes les sessions sandboxées.

## Backend

`agents.defaults.sandbox.backend` contrôle **quel runtime** fournit le sandbox :

- `"docker"` (par défaut lorsque le sandboxing est activé) : runtime sandbox local soutenu par Docker.
- `"ssh"` : runtime sandbox distant générique soutenu par SSH.
- `"openshell"` : runtime sandbox soutenu par OpenShell.

La configuration spécifique à SSH se trouve sous `agents.defaults.sandbox.ssh`. La configuration spécifique à OpenShell se trouve sous `plugins.entries.openshell.config`.

### Choisir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Où il s’exécute** | Conteneur local                  | Tout hôte accessible via SSH   | Sandbox géré par OpenShell                          |
| **Configuration**   | `scripts/sandbox-setup.sh`       | Clé SSH + hôte cible           | Plugin OpenShell activé                             |
| **Modèle d’espace de travail** | Montage bind ou copie               | Canonique distant (ensemencement unique) | `mirror` ou `remote`                                |
| **Contrôle réseau** | `docker.network` (par défaut : aucun) | Dépend de l’hôte distant       | Dépend d’OpenShell                                  |
| **Navigateur sandboxé** | Pris en charge                 | Non pris en charge             | Pas encore pris en charge                           |
| **Montages bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Idéal pour**      | Développement local, isolation complète | Décharger vers une machine distante | Sandboxes distants gérés avec synchronisation bidirectionnelle facultative |

### Backend Docker

Le sandboxing est désactivé par défaut. Si vous activez le sandboxing sans choisir de backend, OpenClaw utilise le backend Docker. Il exécute les outils et navigateurs sandboxés localement via le socket du démon Docker (`/var/run/docker.sock`). L’isolation du conteneur sandbox est déterminée par les namespaces Docker.

<Warning>
**Contraintes Docker-out-of-Docker (DooD)**

Si vous déployez la Gateway OpenClaw elle-même comme conteneur Docker, elle orchestre des conteneurs sandbox frères en utilisant le socket Docker de l’hôte (DooD). Cela introduit une contrainte spécifique de mappage de chemin :

- **La config exige des chemins hôte** : la configuration `workspace` dans `openclaw.json` DOIT contenir le **chemin absolu de l’hôte** (par ex. `/home/user/.openclaw/workspaces`), et non le chemin interne du conteneur Gateway. Lorsque OpenClaw demande au démon Docker de lancer un sandbox, le démon évalue les chemins relativement au namespace de l’OS hôte, et non à celui de la Gateway.
- **Parité du pont FS (mappage de volume identique)** : le processus natif de la Gateway OpenClaw écrit aussi des fichiers Heartbeat et de pont dans le répertoire `workspace`. Comme la Gateway évalue la même chaîne exacte (le chemin hôte) depuis son propre environnement conteneurisé, le déploiement de la Gateway DOIT inclure un mappage de volume identique reliant nativement le namespace hôte (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si vous mappez les chemins en interne sans parité absolue avec l’hôte, OpenClaw lève nativement une erreur de permission `EACCES` lorsqu’il tente d’écrire son Heartbeat dans l’environnement du conteneur, car la chaîne de chemin entièrement qualifiée n’existe pas nativement.
</Warning>

### Backend SSH

Utilisez `backend: "ssh"` lorsque vous voulez qu’OpenClaw sandboxe `exec`, les outils de fichiers et les lectures média sur une machine arbitraire accessible en SSH.

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
          // Ou utilisez SecretRef / des contenus en ligne au lieu de fichiers locaux :
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
  <Accordion title="Comment cela fonctionne">
    - OpenClaw crée une racine distante par portée sous `sandbox.ssh.workspaceRoot`.
    - À la première utilisation après création ou recréation, OpenClaw ensemence une fois cet espace de travail distant à partir de l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit`, `apply_patch`, les lectures média de prompt et la préparation des médias entrants s’exécutent directement sur l’espace de travail distant via SSH.
    - OpenClaw ne synchronise pas automatiquement les changements distants vers l’espace de travail local.

  </Accordion>
  <Accordion title="Matériel d’authentification">
    - `identityFile`, `certificateFile`, `knownHostsFile` : utiliser des fichiers locaux existants et les transmettre via la configuration OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData` : utiliser des chaînes en ligne ou SecretRef. OpenClaw les résout via l’instantané d’exécution normal des secrets, les écrit dans des fichiers temporaires avec `0600`, puis les supprime à la fin de la session SSH.
    - Si `*File` et `*Data` sont tous deux définis pour le même élément, `*Data` l’emporte pour cette session SSH.

  </Accordion>
  <Accordion title="Conséquences du modèle canonique distant">
    Il s’agit d’un modèle **canonique distant**. L’espace de travail SSH distant devient le véritable état du sandbox après l’ensemencement initial.

    - Les modifications locales sur l’hôte effectuées hors d’OpenClaw après l’étape d’ensemencement ne sont pas visibles à distance tant que vous ne recréez pas le sandbox.
    - `openclaw sandbox recreate` supprime la racine distante par portée et réensemence depuis le local à la prochaine utilisation.
    - Le sandboxing du navigateur n’est pas pris en charge sur le backend SSH.
    - Les paramètres `sandbox.docker.*` ne s’appliquent pas au backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Utilisez `backend: "openshell"` lorsque vous voulez qu’OpenClaw sandboxe les outils dans un environnement distant géré par OpenShell. Pour le guide complet d’installation, la référence de configuration et la comparaison des modes d’espace de travail, voir la [page OpenShell](/fr/gateway/openshell) dédiée.

OpenShell réutilise le même transport SSH central et le même pont de système de fichiers distant que le backend SSH générique, et ajoute le cycle de vie spécifique à OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) ainsi que le mode d’espace de travail facultatif `mirror`.

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

- `mirror` (par défaut) : l’espace de travail local reste canonique. OpenClaw synchronise les fichiers locaux dans OpenShell avant `exec` et resynchronise l’espace de travail distant après `exec`.
- `remote` : l’espace de travail OpenShell est canonique après la création du sandbox. OpenClaw ensemence une fois l’espace de travail distant à partir de l’espace de travail local, puis les outils de fichiers et `exec` s’exécutent directement sur le sandbox distant sans resynchroniser les changements en retour.

<AccordionGroup>
  <Accordion title="Détails du transport distant">
    - OpenClaw demande à OpenShell une configuration SSH spécifique au sandbox via `openshell sandbox ssh-config <name>`.
    - Le noyau écrit cette configuration SSH dans un fichier temporaire, ouvre la session SSH, et réutilise le même pont de système de fichiers distant que celui utilisé par `backend: "ssh"`.
    - En mode `mirror`, seul le cycle de vie diffère : synchroniser du local vers le distant avant `exec`, puis resynchroniser après `exec`.

  </Accordion>
  <Accordion title="Limites actuelles d’OpenShell">
    - le navigateur sandboxé n’est pas encore pris en charge
    - `sandbox.docker.binds` n’est pas pris en charge sur le backend OpenShell
    - les réglages d’exécution spécifiques à Docker sous `sandbox.docker.*` s’appliquent toujours uniquement au backend Docker

  </Accordion>
</AccordionGroup>

#### Modes d’espace de travail

OpenShell a deux modèles d’espace de travail. C’est la partie qui compte le plus en pratique.

<Tabs>
  <Tab title="mirror (canonique local)">
    Utilisez `plugins.entries.openshell.config.mode: "mirror"` lorsque vous voulez que **l’espace de travail local reste canonique**.

    Comportement :

    - Avant `exec`, OpenClaw synchronise l’espace de travail local dans le sandbox OpenShell.
    - Après `exec`, OpenClaw resynchronise l’espace de travail distant vers l’espace de travail local.
    - Les outils de fichiers fonctionnent toujours via le pont sandbox, mais l’espace de travail local reste la source de vérité entre les tours.

    Utilisez-le lorsque :

    - vous modifiez des fichiers localement en dehors d’OpenClaw et voulez que ces changements apparaissent automatiquement dans le sandbox
    - vous voulez que le sandbox OpenShell se comporte autant que possible comme le backend Docker
    - vous voulez que l’espace de travail hôte reflète les écritures sandbox après chaque tour `exec`

    Compromis : coût de synchronisation supplémentaire avant et après `exec`.

  </Tab>
  <Tab title="remote (OpenShell canonique)">
    Utilisez `plugins.entries.openshell.config.mode: "remote"` lorsque vous voulez que **l’espace de travail OpenShell devienne canonique**.

    Comportement :

    - Lorsque le sandbox est créé pour la première fois, OpenClaw ensemence une fois l’espace de travail distant à partir de l’espace de travail local.
    - Ensuite, `exec`, `read`, `write`, `edit`, et `apply_patch` s’exécutent directement sur l’espace de travail OpenShell distant.
    - OpenClaw **ne** synchronise **pas** les changements distants vers l’espace de travail local après `exec`.
    - Les lectures média au moment du prompt continuent à fonctionner parce que les outils de fichiers et de médias lisent via le pont sandbox au lieu de supposer un chemin local sur l’hôte.
    - Le transport passe par SSH dans le sandbox OpenShell renvoyé par `openshell sandbox ssh-config`.

    Conséquences importantes :

    - Si vous modifiez des fichiers sur l’hôte en dehors d’OpenClaw après l’étape d’ensemencement, le sandbox distant **ne** verra **pas** automatiquement ces changements.
    - Si le sandbox est recréé, l’espace de travail distant est de nouveau ensemencé à partir de l’espace de travail local.
    - Avec `scope: "agent"` ou `scope: "shared"`, cet espace de travail distant est partagé à cette même portée.

    Utilisez-le lorsque :

    - le sandbox doit vivre principalement du côté distant OpenShell
    - vous voulez une surcharge de synchronisation plus faible par tour
    - vous ne voulez pas que les modifications locales sur l’hôte écrasent silencieusement l’état du sandbox distant

  </Tab>
</Tabs>

Choisissez `mirror` si vous considérez le sandbox comme un environnement d’exécution temporaire. Choisissez `remote` si vous considérez le sandbox comme le véritable espace de travail.

#### Cycle de vie OpenShell

Les sandboxes OpenShell sont toujours gérés via le cycle de vie sandbox normal :

- `openclaw sandbox list` affiche les runtimes OpenShell ainsi que les runtimes Docker
- `openclaw sandbox recreate` supprime le runtime actuel et laisse OpenClaw le recréer à la prochaine utilisation
- la logique d’élagage tient aussi compte du backend

Pour le mode `remote`, recréer est particulièrement important :

- recreater supprime l’espace de travail distant canonique pour cette portée
- l’utilisation suivante ensemence un nouvel espace de travail distant à partir de l’espace de travail local

Pour le mode `mirror`, recreater réinitialise surtout l’environnement d’exécution distant puisque l’espace de travail local reste de toute façon canonique.

## Accès à l’espace de travail

`agents.defaults.sandbox.workspaceAccess` contrôle **ce que le sandbox peut voir** :

<Tabs>
  <Tab title="none (par défaut)">
    Les outils voient un espace de travail sandbox sous `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monte l’espace de travail de l’agent en lecture seule sous `/agent` (désactive `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monte l’espace de travail de l’agent en lecture/écriture sous `/workspace`.
  </Tab>
</Tabs>

Avec le backend OpenShell :

- le mode `mirror` utilise toujours l’espace de travail local comme source canonique entre les tours `exec`
- le mode `remote` utilise l’espace de travail OpenShell distant comme source canonique après l’ensemencement initial
- `workspaceAccess: "ro"` et `"none"` restreignent toujours le comportement d’écriture de la même manière

Les médias entrants sont copiés dans l’espace de travail sandbox actif (`media/inbound/*`).

<Note>
**Note sur les Skills :** l’outil `read` est enraciné dans le sandbox. Avec `workspaceAccess: "none"`, OpenClaw recopie les Skills éligibles dans l’espace de travail sandbox (`.../skills`) afin qu’ils puissent être lus. Avec `"rw"`, les Skills de l’espace de travail sont lisibles depuis `/workspace/skills`.
</Note>

## Montages bind personnalisés

`agents.defaults.sandbox.docker.binds` monte des répertoires hôte supplémentaires dans le conteneur. Format : `host:container:mode` (par ex. `"/home/user/source:/source:rw"`).

Les montages globaux et par agent sont **fusionnés** (et non remplacés). Avec `scope: "shared"`, les montages par agent sont ignorés.

`agents.defaults.sandbox.browser.binds` monte des répertoires hôte supplémentaires uniquement dans le conteneur du **navigateur sandboxé**.

- Lorsqu’il est défini (y compris `[]`), il remplace `agents.defaults.sandbox.docker.binds` pour le conteneur navigateur.
- Lorsqu’il est omis, le conteneur navigateur revient à `agents.defaults.sandbox.docker.binds` (compatibilité ascendante).

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

- Les montages bind contournent le système de fichiers du sandbox : ils exposent les chemins de l’hôte avec le mode que vous définissez (`:ro` ou `:rw`).
- OpenClaw bloque les sources de montage bind dangereuses (par exemple : `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, et les montages parents qui les exposeraient).
- OpenClaw bloque aussi les racines courantes d’identifiants dans le répertoire personnel telles que `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, et `~/.ssh`.
- La validation des montages bind ne se limite pas à une correspondance de chaîne. OpenClaw normalise le chemin source, puis le résout de nouveau via l’ancêtre existant le plus profond avant de revérifier les chemins bloqués et les racines autorisées.
- Cela signifie que les échappements par parent symlink échouent toujours en mode fermé même lorsque la feuille finale n’existe pas encore. Exemple : `/workspace/run-link/new-file` se résout quand même vers `/var/run/...` si `run-link` pointe là.
- Les racines sources autorisées sont canonisées de la même manière, de sorte qu’un chemin qui ne semble être dans la liste d’autorisation qu’avant résolution des symlinks est quand même rejeté comme `outside allowed roots`.
- Les montages sensibles (secrets, clés SSH, identifiants de service) devraient être en `:ro` sauf nécessité absolue.
- Combinez avec `workspaceAccess: "ro"` si vous n’avez besoin que d’un accès en lecture à l’espace de travail ; les modes de montage bind restent indépendants.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour savoir comment les montages bind interagissent avec la politique d’outils et `exec` élevé.

</Warning>

## Images et configuration

Image Docker par défaut : `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Construire l’image par défaut">
    ```bash
    scripts/sandbox-setup.sh
    ```

    L’image par défaut **n’inclut pas** Node. Si une Skill a besoin de Node (ou d’autres runtimes), intégrez soit une image personnalisée, soit installez-le via `sandbox.docker.setupCommand` (nécessite une sortie réseau + une racine inscriptible + un utilisateur root).

  </Step>
  <Step title="Facultatif : construire l’image commune">
    Pour une image sandbox plus fonctionnelle avec des outils courants (par exemple `curl`, `jq`, `nodejs`, `python3`, `git`) :

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Définissez ensuite `agents.defaults.sandbox.docker.image` sur `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facultatif : construire l’image du navigateur sandboxé">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Par défaut, les conteneurs sandbox Docker s’exécutent **sans réseau**. Remplacez cela avec `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valeurs par défaut Chromium du navigateur sandboxé">
    L’image intégrée du navigateur sandboxé applique aussi des valeurs de démarrage Chromium prudentes pour les charges de travail conteneurisées. Les valeurs par défaut actuelles du conteneur incluent :

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
    - Les trois drapeaux de durcissement graphique (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sont facultatifs et utiles lorsque les conteneurs n’ont pas de prise en charge GPU. Définissez `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si votre charge de travail nécessite WebGL ou d’autres fonctionnalités 3D/navigateur.
    - `--disable-extensions` est activé par défaut et peut être désactivé avec `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` pour les flux dépendants des extensions.
    - `--renderer-process-limit=2` est contrôlé par `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, où `0` conserve la valeur par défaut de Chromium.

    Si vous avez besoin d’un autre profil d’exécution, utilisez une image navigateur personnalisée et fournissez votre propre entrypoint. Pour les profils Chromium locaux (non conteneurisés), utilisez `browser.extraArgs` pour ajouter des drapeaux de démarrage supplémentaires.

  </Accordion>
  <Accordion title="Valeurs de sécurité réseau par défaut">
    - `network: "host"` est bloqué.
    - `network: "container:<id>"` est bloqué par défaut (risque de contournement par jointure de namespace).
    - Remplacement break-glass : `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Les installations Docker et la Gateway conteneurisée se trouvent ici : [Docker](/fr/install/docker)

Pour les déploiements Docker de la Gateway, `scripts/docker/setup.sh` peut amorcer la configuration du sandbox. Définissez `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) pour activer ce chemin. Vous pouvez remplacer l’emplacement du socket avec `OPENCLAW_DOCKER_SOCKET`. Configuration complète et référence env : [Docker](/fr/install/docker#agent-sandbox).

## setupCommand (configuration unique du conteneur)

`setupCommand` s’exécute **une seule fois** après la création du conteneur sandbox (pas à chaque exécution). Il s’exécute à l’intérieur du conteneur via `sh -lc`.

Chemins :

- Global : `agents.defaults.sandbox.docker.setupCommand`
- Par agent : `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Pièges courants">
    - `docker.network` vaut `"none"` par défaut (pas de sortie), donc les installations de paquets échoueront.
    - `docker.network: "container:<id>"` nécessite `dangerouslyAllowContainerNamespaceJoin: true` et n’est prévu qu’en mode break-glass.
    - `readOnlyRoot: true` empêche les écritures ; définissez `readOnlyRoot: false` ou intégrez une image personnalisée.
    - `user` doit être root pour les installations de paquets (omettez `user` ou définissez `user: "0:0"`).
    - Le sandbox `exec` n’hérite **pas** du `process.env` de l’hôte. Utilisez `agents.defaults.sandbox.docker.env` (ou une image personnalisée) pour les clés API des Skills.

  </Accordion>
</AccordionGroup>

## Politique d’outils et échappatoires

Les politiques d’autorisation/refus des outils s’appliquent toujours avant les règles du sandbox. Si un outil est refusé globalement ou par agent, le sandboxing ne le rétablit pas.

`tools.elevated` est une échappatoire explicite qui exécute `exec` hors du sandbox (`gateway` par défaut, ou `node` lorsque la cible `exec` est `node`). Les directives `/exec` ne s’appliquent qu’aux expéditeurs autorisés et persistent par session ; pour désactiver complètement `exec`, utilisez le refus via la politique d’outils (voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Débogage :

- Utilisez `openclaw sandbox explain` pour inspecter le mode sandbox effectif, la politique d’outils, et les clés de configuration correctives.
- Voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) pour le modèle mental « pourquoi est-ce bloqué ? ».

Gardez cela verrouillé.

## Remplacements multi-agents

Chaque agent peut remplacer sandbox + outils : `agents.list[].sandbox` et `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` pour la politique d’outils sandbox). Voir [Sandbox & outils multi-agents](/fr/tools/multi-agent-sandbox-tools) pour la priorité.

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

- [Sandbox & outils multi-agents](/fr/tools/multi-agent-sandbox-tools) — remplacements par agent et priorité
- [OpenShell](/fr/gateway/openshell) — configuration du backend sandbox géré, modes d’espace de travail, et référence de configuration
- [Configuration du sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — déboguer « pourquoi est-ce bloqué ? »
- [Sécurité](/fr/gateway/security)
