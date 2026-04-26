---
read_when:
    - Vous voulez une Gateway conteneurisée au lieu d’installations locales
    - Vous validez le flux Docker
summary: Configuration et intégration guidée facultatives basées sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker est **facultatif**. Utilisez-le uniquement si vous voulez une Gateway conteneurisée ou valider le flux Docker.

## Docker me convient-il ?

- **Oui** : vous voulez un environnement Gateway isolé et jetable ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous l’exécutez sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d’installation normal.
- **Note sur le sandboxing** : le backend sandbox par défaut utilise Docker lorsque le sandboxing est activé, mais le sandboxing est désactivé par défaut et **n’exige pas** que la Gateway complète s’exécute dans Docker. Les backends sandbox SSH et OpenShell sont également disponibles. Voir [Sandboxing](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l’image (`pnpm install` peut être tué par OOM sur des hôtes de 1 Go avec le code de sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- Si vous l’exécutez sur un VPS/hôte public, consultez
  [Durcissement de sécurité pour l’exposition réseau](/fr/gateway/security),
  en particulier la politique de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisée

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit l’image Gateway localement. Pour utiliser à la place une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées sur la
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tags courants : `main`, `latest`, `<version>` (par ex. `2026.2.26`).

  </Step>

  <Step title="Terminer l’intégration guidée">
    Le script de configuration exécute automatiquement l’intégration guidée. Il va :

    - demander les clés API du fournisseur
    - générer un token de Gateway et l’écrire dans `.env`
    - démarrer la Gateway via Docker Compose

    Pendant la configuration, l’intégration guidée avant démarrage et les écritures de configuration passent directement par
    `openclaw-gateway`. `openclaw-cli` est destiné aux commandes que vous exécutez après
    l’existence du conteneur Gateway.

  </Step>

  <Step title="Ouvrir la Control UI">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le secret partagé configuré
    dans Settings. Le script de configuration écrit par défaut un token dans `.env` ; si vous basculez la configuration du conteneur en authentification par mot de passe, utilisez ce
    mot de passe à la place.

    Besoin à nouveau de l’URL ?

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

Si vous préférez exécuter chaque étape vous-même au lieu d’utiliser le script de configuration :

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
Comme `openclaw-cli` partage le namespace réseau de `openclaw-gateway`, c’est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’intégration guidée
et les écritures de configuration au moment de l’installation via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                                   | Objectif                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Utiliser une image distante au lieu d’une construction locale   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installer des paquets apt supplémentaires pendant la construction (séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`                      | Préinstaller les dépendances de Plugin au moment de la construction (noms séparés par des espaces) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montages bind hôte supplémentaires (liste `source:target[:opts]` séparée par des virgules) |
| `OPENCLAW_HOME_VOLUME`                     | Persister `/home/node` dans un volume Docker nommé             |
| `OPENCLAW_SANDBOX`                         | Activer explicitement l’amorçage du sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Remplacer le chemin du socket Docker                            |
| `OPENCLAW_DISABLE_BONJOUR`                 | Désactiver la publicité Bonjour/mDNS (vaut `1` par défaut pour Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Désactiver les overlays bind-mount des sources de Plugins intégrés |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Point de terminaison partagé du collecteur OTLP/HTTP pour l’export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Points de terminaison OTLP spécifiques au signal pour traces, métriques ou journaux |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Remplacement du protocole OTLP. Seul `http/protobuf` est pris en charge aujourd’hui |
| `OTEL_SERVICE_NAME`                        | Nom du service utilisé pour les ressources OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Activation explicite des derniers attributs sémantiques GenAI expérimentaux |
| `OPENCLAW_OTEL_PRELOADED`                  | Ne pas démarrer un second SDK OpenTelemetry lorsqu’un premier est préchargé |

Les mainteneurs peuvent tester la source d’un Plugin intégré contre une image packagée en montant
un répertoire source de Plugin sur son chemin source packagé, par exemple
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ce répertoire source monté remplace le bundle compilé correspondant
`/app/dist/extensions/synology-chat` pour le même id de Plugin.

### Observabilité

L’export OpenTelemetry est sortant depuis le conteneur Gateway vers votre collecteur OTLP.
Il ne nécessite pas de port Docker publié. Si vous construisez l’image
localement et voulez que l’exporteur OpenTelemetry intégré soit disponible dans l’image,
incluez ses dépendances d’exécution :

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

L’image officielle Docker de release OpenClaw inclut la source du plugin intégré
`diagnostics-otel`. Selon l’image et l’état du cache, la
Gateway peut quand même préparer les dépendances d’exécution OpenTelemetry locales au Plugin la
première fois que le plugin est activé ; laissez donc ce premier démarrage accéder au registre de paquets
ou préchauffez l’image dans votre lane de release. Pour activer l’export, autorisez et
activez le plugin `diagnostics-otel` dans la configuration, puis définissez
`diagnostics.otel.enabled=true` ou utilisez l’exemple de configuration dans
[Export OpenTelemetry](/fr/gateway/opentelemetry). Les en-têtes d’authentification du collecteur sont
configurés via `diagnostics.otel.headers`, pas via des variables d’environnement Docker.

Les métriques Prometheus utilisent le port Gateway déjà publié. Activez le
plugin `diagnostics-prometheus`, puis scrapez :

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route est protégée par l’authentification Gateway. N’exposez pas un port `/metrics`
public séparé ni un chemin reverse-proxy non authentifié. Voir
[Métriques Prometheus](/fr/gateway/prometheus).

### Vérifications d’état

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # vivacité
curl -fsS http://127.0.0.1:18789/readyz     # disponibilité
```

L’image Docker inclut un `HEALTHCHECK` intégré qui sonde `/healthz`.
Si les vérifications continuent d’échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané d’état de santé approfondi authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` définit par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l’accès hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de port Docker.

- `lan` (par défaut) : le navigateur hôte et la CLI hôte peuvent atteindre le port Gateway publié.
- `loopback` : seuls les processus dans le namespace réseau du conteneur peuvent atteindre
  directement la Gateway.

<Note>
Utilisez des valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), et non des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Bonjour / mDNS

Le réseau bridge Docker ne relaie généralement pas de façon fiable le multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configuration Compose intégrée définit donc par défaut
`OPENCLAW_DISABLE_BONJOUR=1` afin que la Gateway n’entre pas dans une boucle de crash ni ne
redémarre sans cesse la publicité lorsque le bridge perd le trafic multicast.

Utilisez l’URL Gateway publiée, Tailscale ou DNS-SD à large zone pour les hôtes Docker.
Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement lorsque vous utilisez le réseau hôte, macvlan,
ou un autre réseau où le multicast mDNS fonctionne de manière fiable.

Pour les pièges et le dépannage, voir [Découverte Bonjour](/fr/gateway/bonjour).

### Stockage et persistance

Docker Compose monte `OPENCLAW_CONFIG_DIR` en bind sur `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` sur `/home/node/.openclaw/workspace`, de sorte que ces chemins
survivent au remplacement du conteneur.

Ce répertoire de configuration monté est celui où OpenClaw conserve :

- `openclaw.json` pour la configuration de comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé API des fournisseurs stockée
- `.env` pour les secrets d’exécution soutenus par env comme `OPENCLAW_GATEWAY_TOKEN`

Pour tous les détails de persistance sur les déploiements VM, voir
[Docker VM Runtime - What persists where](/fr/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session, `cron/runs/*.jsonl`,
et les journaux de fichiers rotatifs sous `/tmp/openclaw/`.

### Aides shell (facultatif)

Pour faciliter la gestion quotidienne de Docker, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock depuis l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, réexécutez la commande d’installation ci-dessus afin que votre fichier d’aide local suive le nouvel emplacement.

Ensuite, utilisez `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Voir [ClawDock](/fr/install/clawdock) pour le guide complet des aides.

<AccordionGroup>
  <Accordion title="Activer le sandbox d’agent pour la Gateway Docker">
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

    Le script ne monte `docker.sock` qu’une fois les prérequis du sandbox validés. Si
    la configuration du sandbox ne peut pas être terminée, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation pseudo-TTY de Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Note de sécurité sur le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes CLI
    puissent atteindre la Gateway via `127.0.0.1`. Traitez cela comme une
    frontière de confiance partagée. La configuration Compose supprime `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous voyez des erreurs de permission sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind hôte appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Ordonnez votre Dockerfile de manière à mettre en cache les couches de dépendances. Cela évite de relancer
    `pnpm install` sauf si les lockfiles changent :

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
    L’image par défaut privilégie la sécurité et s’exécute en tant que `node` non-root. Pour un
    conteneur plus complet :

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
    Si vous choisissez OAuth OpenAI Codex dans l’assistant, il ouvre une URL dans le navigateur. Dans les
    configurations Docker ou headless, copiez l’URL complète de redirection sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image Docker principale utilise `node:24-bookworm` et publie des annotations OCI d’image de base
    incluant `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, et d’autres. Voir
    [Annotations d’image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Voir [Hetzner (Docker VPS)](/fr/install/hetzner) et
[Docker VM Runtime](/fr/install/docker-vm-runtime) pour les étapes partagées de déploiement VM
incluant l’intégration de binaires, la persistance et les mises à jour.

## Sandbox d’agent

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, la Gateway
exécute les outils de l’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker
isolés tandis que la Gateway elle-même reste sur l’hôte. Cela vous donne une barrière forte
autour des sessions d’agent non fiables ou multi-tenant sans conteneuriser toute la
Gateway.

La portée du sandbox peut être par agent (par défaut), par session ou partagée. Chaque portée
reçoit son propre espace de travail monté sur `/workspace`. Vous pouvez également configurer
des politiques d’autorisation/refus des outils, l’isolation réseau, les limites de ressources et des
conteneurs navigateur.

Pour la configuration complète, les images, les notes de sécurité et les profils multi-agents, voir :

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du sandbox
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs sandbox
- [Sandbox et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

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

Construisez l’image sandbox par défaut :

```bash
scripts/sandbox-setup.sh
```

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur sandbox qui ne démarre pas">
    Construisez l’image sandbox avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs de permission dans le sandbox">
    Définissez `docker.user` sur un UID:GID correspondant à la propriété de votre espace de travail monté,
    ou changez le propriétaire du dossier de l’espace de travail.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans le sandbox">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), ce qui source
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Tué par OOM pendant la construction de l’image (sortie 137)">
    La VM a besoin d’au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans la Control UI">
    Récupérez un nouveau lien de dashboard et approuvez l’appareil navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Dashboard](/fr/web/dashboard), [Appareils](/fr/cli/devices).

  </Accordion>

  <Accordion title="La cible Gateway affiche ws://172.x.x.x ou erreurs d’appairage depuis la CLI Docker">
    Réinitialisez le mode et la liaison de la Gateway :

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Associé

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Podman](/fr/install/podman) — alternative Podman à Docker
- [ClawDock](/fr/install/clawdock) — configuration communautaire Docker Compose
- [Mise à jour](/fr/install/updating) — maintenir OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration de la Gateway après installation
