---
read_when:
    - Vous voulez un Gateway conteneurisé au lieu d’installations locales
    - Vous validez le flux Docker
summary: Configuration et onboarding facultatifs d’OpenClaw basés sur Docker
title: Docker
x-i18n:
    generated_at: "2026-04-23T07:04:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (facultatif)

Docker est **facultatif**. Utilisez-le uniquement si vous voulez un Gateway conteneurisé ou valider le flux Docker.

## Docker est-il adapté à mon cas ?

- **Oui** : vous voulez un environnement Gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous l’exécutez sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d’installation normal.
- **Remarque sur l’isolation** : le backend d’isolation par défaut utilise Docker lorsque l’isolation est activée, mais l’isolation est désactivée par défaut et ne nécessite **pas** que l’ensemble du Gateway s’exécute dans Docker. Les backends d’isolation SSH et OpenShell sont aussi disponibles. Consultez [Sandboxing](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l’image (`pnpm install` peut être tué par OOM sur les hôtes à 1 Go avec le code de sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- Si vous exécutez sur un VPS/hôte public, consultez
  [Security hardening for network exposure](/fr/gateway/security),
  en particulier la politique de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisé

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit l’image du gateway localement. Pour utiliser à la place une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées sur le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Balises courantes : `main`, `latest`, `<version>` (par exemple `2026.2.26`).

  </Step>

  <Step title="Terminer l’onboarding">
    Le script de configuration exécute automatiquement l’onboarding. Il va :

    - demander les clés API des providers
    - générer un jeton Gateway et l’écrire dans `.env`
    - démarrer le gateway via Docker Compose

    Pendant la configuration, l’onboarding avant démarrage et les écritures de configuration passent par
    `openclaw-gateway` directement. `openclaw-cli` sert pour les commandes que vous exécutez après
    l’existence du conteneur gateway.

  </Step>

  <Step title="Ouvrir la Control UI">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le
    secret partagé configuré dans Settings. Le script de configuration écrit par
    défaut un jeton dans `.env` ; si vous basculez la configuration du conteneur vers une authentification par mot de passe, utilisez plutôt ce
    mot de passe.

    Besoin de l’URL à nouveau ?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurer les canaux (facultatif)">
    Utilisez le conteneur CLI pour ajouter des canaux de messagerie :

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord)

  </Step>
</Steps>

### Flux manuel

Si vous préférez exécuter vous-même chaque étape au lieu d’utiliser le script de configuration :

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Exécutez `docker compose` depuis la racine du dépôt. Si vous avez activé `OPENCLAW_EXTRA_MOUNTS`
ou `OPENCLAW_HOME_VOLUME`, le script de configuration écrit `docker-compose.extra.yml` ;
incluez-le avec `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Comme `openclaw-cli` partage l’espace de noms réseau de `openclaw-gateway`, c’est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’onboarding
et les écritures de configuration au moment de l’installation via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                       | Objectif                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Utiliser une image distante au lieu de construire localement    |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installer des paquets apt supplémentaires pendant le build (noms séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`          | Préinstaller les dépendances de plugins au moment du build (noms séparés par des espaces) |
| `OPENCLAW_EXTRA_MOUNTS`        | Montages bind supplémentaires depuis l’hôte (liste séparée par des virgules `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | Persister `/home/node` dans un volume Docker nommé              |
| `OPENCLAW_SANDBOX`             | Activer l’amorçage de l’isolation (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`       | Remplacer le chemin du socket Docker                            |

### Vérifications d’état

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # vivacité
curl -fsS http://127.0.0.1:18789/readyz     # disponibilité
```

L’image Docker inclut un `HEALTHCHECK` intégré qui interroge `/healthz`.
Si les vérifications continuent d’échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané approfondi de santé avec authentification :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` utilise par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l’accès depuis l’hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de ports Docker.

- `lan` (par défaut) : le navigateur hôte et la CLI hôte peuvent atteindre le port gateway publié.
- `loopback` : seuls les processus à l’intérieur de l’espace de noms réseau du conteneur peuvent atteindre
  directement le gateway.

<Note>
Utilisez les valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), pas des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Stockage et persistance

Docker Compose monte en bind `OPENCLAW_CONFIG_DIR` vers `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` vers `/home/node/.openclaw/workspace`, de sorte que ces chemins
survivent au remplacement du conteneur.

Ce répertoire de configuration monté est l’endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification provider OAuth/clé API stockée
- `.env` pour les secrets d’exécution adossés à l’environnement tels que `OPENCLAW_GATEWAY_TOKEN`

Pour les détails complets de persistance sur des déploiements VM, consultez
[Docker VM Runtime - What persists where](/fr/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session, `cron/runs/*.jsonl`,
et les journaux de fichiers rotatifs sous `/tmp/openclaw/`.

### Assistants shell (facultatif)

Pour une gestion Docker plus simple au quotidien, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock depuis l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, réexécutez la commande d’installation ci-dessus afin que votre fichier d’assistance local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Consultez [ClawDock](/fr/install/clawdock) pour le guide complet de cet assistant.

<AccordionGroup>
  <Accordion title="Activer l’isolation d’agent pour le gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Chemin de socket personnalisé (par ex. Docker rootless) :

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Le script monte `docker.sock` uniquement après validation des prérequis d’isolation. Si
    la configuration de l’isolation ne peut pas s’achever, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation pseudo-TTY de Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Remarque de sécurité sur le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes CLI
    puissent atteindre le gateway via `127.0.0.1`. Traitez cela comme une
    frontière de confiance partagée. La configuration Compose retire `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous voyez des erreurs d’autorisation sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind hôte appartiennent à uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Ordonnez votre Dockerfile de façon à mettre en cache les couches de dépendances. Cela évite de relancer
    `pnpm install` tant que les lockfiles ne changent pas :

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Options de conteneur pour utilisateurs avancés">
    L’image par défaut privilégie la sécurité et s’exécute en tant que `node` non root. Pour un conteneur plus
    complet :

    1. **Persister `/home/node`** : `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Intégrer les dépendances système** : `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installer les navigateurs Playwright** :
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persister les téléchargements du navigateur** : définissez
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` et utilisez
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Si vous choisissez OAuth OpenAI Codex dans l’assistant, il ouvre une URL dans le navigateur. En
    contexte Docker ou headless, copiez l’URL complète de redirection sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image Docker principale utilise `node:24-bookworm` et publie des annotations OCI d’image de base
    comprenant `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, entre autres. Consultez
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Consultez [Hetzner (Docker VPS)](/fr/install/hetzner) et
[Docker VM Runtime](/fr/install/docker-vm-runtime) pour les étapes de déploiement sur VM partagée,
y compris l’intégration des binaires, la persistance et les mises à jour.

## Isolation des agents

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, le gateway
exécute l’exécution des outils d’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker
isolés tandis que le gateway lui-même reste sur l’hôte. Cela vous donne une barrière forte
autour des sessions d’agent non fiables ou multi-tenant sans conteneuriser l’ensemble du
gateway.

La portée de l’isolation peut être par agent (par défaut), par session ou partagée. Chaque portée
dispose de son propre espace de travail monté sur `/workspace`. Vous pouvez aussi configurer
des politiques d’autorisation/interdiction d’outils, l’isolation réseau, des limites de ressources et des
conteneurs navigateur.

Pour la configuration complète, les images, les remarques de sécurité et les profils multi-agents, consultez :

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète de l’isolation
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs isolés
- [Multi-Agent Sandbox and Tools](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

### Activation rapide

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Construisez l’image d’isolation par défaut :

```bash
scripts/sandbox-setup.sh
```

## Dépannage

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur isolé qui ne démarre pas">
    Construisez l’image d’isolation avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs d’autorisation dans l’isolation">
    Définissez `docker.user` sur un UID:GID correspondant à la propriété de votre espace de travail monté,
    ou appliquez `chown` au dossier d’espace de travail.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans l’isolation">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), ce qui source
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Tué par OOM pendant la construction de l’image (exit 137)">
    La VM a besoin d’au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans la Control UI">
    Récupérez un nouveau lien de tableau de bord et approuvez l’appareil navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Dashboard](/fr/web/dashboard), [Devices](/fr/cli/devices).

  </Accordion>

  <Accordion title="La cible Gateway affiche ws://172.x.x.x ou des erreurs d’appairage depuis la CLI Docker">
    Réinitialisez le mode et la liaison du gateway :

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liens connexes

- [Install Overview](/fr/install) — toutes les méthodes d’installation
- [Podman](/fr/install/podman) — alternative Podman à Docker
- [ClawDock](/fr/install/clawdock) — configuration communautaire Docker Compose
- [Updating](/fr/install/updating) — garder OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration du gateway après l’installation
