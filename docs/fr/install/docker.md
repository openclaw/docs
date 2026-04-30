---
read_when:
    - Vous souhaitez une Gateway conteneurisée plutôt que des installations locales
    - Vous validez le flux Docker
summary: Configuration et intégration facultatives basées sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-30T07:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker est **facultatif**. Utilisez-le uniquement si vous voulez un Gateway conteneurisé ou valider le flux Docker.

## Docker est-il adapté à mon cas ?

- **Oui** : vous voulez un environnement Gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous l’exécutez sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d’installation normal.
- **Note sur le sandboxing** : le backend de sandboxing par défaut utilise Docker lorsque le sandboxing est activé, mais le sandboxing est désactivé par défaut et ne nécessite **pas** que le Gateway complet s’exécute dans Docker. Les backends de sandboxing SSH et OpenShell sont également disponibles. Consultez [Sandboxing](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l’image (`pnpm install` peut être tué pour manque de mémoire sur les hôtes à 1 Go avec le code de sortie 137)
- Assez d’espace disque pour les images et les journaux
- En cas d’exécution sur un VPS ou un hôte public, consultez
  [Renforcement de la sécurité pour l’exposition réseau](/fr/gateway/security),
  en particulier la politique de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisé

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit l’image du Gateway localement. Pour utiliser plutôt une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées dans le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Balises courantes : `main`, `latest`, `<version>` (par ex. `2026.2.26`).

  </Step>

  <Step title="Terminer l’intégration">
    Le script de configuration exécute automatiquement l’intégration. Il va :

    - demander les clés API des fournisseurs
    - générer un jeton Gateway et l’écrire dans `.env`
    - démarrer le Gateway via Docker Compose

    Pendant la configuration, l’intégration avant démarrage et les écritures de configuration passent directement par
    `openclaw-gateway`. `openclaw-cli` sert aux commandes que vous exécutez après
    que le conteneur Gateway existe déjà.

  </Step>

  <Step title="Ouvrir l’interface de contrôle">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le secret partagé
    configuré dans les paramètres. Le script de configuration écrit par défaut un jeton dans `.env` ;
    si vous remplacez la configuration du conteneur par une authentification par mot de passe, utilisez plutôt ce
    mot de passe.

    Besoin de retrouver l’URL ?

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

    Docs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord)

  </Step>
</Steps>

### Flux manuel

Si vous préférez exécuter chaque étape vous-même plutôt que d’utiliser le script de configuration :

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
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’intégration
et les écritures de configuration de mise en place via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                                   | Objectif                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Utiliser une image distante au lieu d’une construction locale   |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installer des paquets apt supplémentaires pendant la construction (séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`                      | Préinstaller les dépendances de plugins au moment de la construction (noms séparés par des espaces) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montages bind d’hôte supplémentaires (`source:target[:opts]` séparés par des virgules) |
| `OPENCLAW_HOME_VOLUME`                     | Persister `/home/node` dans un volume Docker nommé             |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Chemin du conteneur pour les dépendances et miroirs de plugins intégrés générés |
| `OPENCLAW_SANDBOX`                         | Activer l’amorçage du sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | Ignorer l’étape d’intégration interactive (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Remplacer le chemin du socket Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | Désactiver l’annonce Bonjour/mDNS (par défaut `1` pour Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Désactiver les superpositions par bind-mount des sources de plugins intégrés |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Point de terminaison collecteur OTLP/HTTP partagé pour l’export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Points de terminaison OTLP propres au signal pour les traces, métriques ou journaux |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Remplacement du protocole OTLP. Seul `http/protobuf` est pris en charge aujourd’hui |
| `OTEL_SERVICE_NAME`                        | Nom de service utilisé pour les ressources OpenTelemetry       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Opter pour les derniers attributs sémantiques expérimentaux GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | Éviter de démarrer un second SDK OpenTelemetry lorsqu’un est préchargé |

Les mainteneurs peuvent tester la source d’un plugin intégré avec une image empaquetée en montant
un répertoire source de plugin par-dessus son chemin source empaqueté, par exemple
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ce répertoire source monté remplace le bundle compilé correspondant
`/app/dist/extensions/synology-chat` pour le même identifiant de plugin.

### Observabilité

L’export OpenTelemetry sort du conteneur Gateway vers votre collecteur OTLP.
Il ne nécessite pas de port Docker publié. Si vous construisez l’image
localement et voulez que l’exportateur OpenTelemetry intégré soit disponible dans l’image,
incluez ses dépendances d’exécution :

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

L’image de version Docker officielle d’OpenClaw inclut la source du plugin intégré
`diagnostics-otel`. Selon l’image et l’état du cache, le
Gateway peut encore préparer les dépendances d’exécution OpenTelemetry locales au plugin la
première fois que le plugin est activé ; autorisez donc ce premier démarrage à atteindre le registre
de paquets ou préchauffez l’image dans votre voie de publication. Pour activer l’export, autorisez et
activez le plugin `diagnostics-otel` dans la configuration, puis définissez
`diagnostics.otel.enabled=true` ou utilisez l’exemple de configuration dans
[Export OpenTelemetry](/fr/gateway/opentelemetry). Les en-têtes d’authentification du collecteur sont
configurés via `diagnostics.otel.headers`, pas via des variables d’environnement Docker.

Les métriques Prometheus utilisent le port Gateway déjà publié. Activez le
plugin `diagnostics-prometheus`, puis collectez :

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route est protégée par l’authentification Gateway. N’exposez pas de port public
`/metrics` séparé ni de chemin de proxy inverse non authentifié. Consultez
[Métriques Prometheus](/fr/gateway/prometheus).

### Vérifications de santé

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L’image Docker inclut un `HEALTHCHECK` intégré qui interroge `/healthz`.
Si les vérifications continuent d’échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané de santé approfondi authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` définit par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l’accès hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de port Docker.

- `lan` (par défaut) : le navigateur de l’hôte et la CLI de l’hôte peuvent atteindre le port Gateway publié.
- `loopback` : seuls les processus dans l’espace de noms réseau du conteneur peuvent atteindre
  directement le Gateway.

<Note>
Utilisez les valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), pas des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Fournisseurs locaux de l’hôte

Quand OpenClaw s’exécute dans Docker, `127.0.0.1` à l’intérieur du conteneur désigne le conteneur
lui-même, pas votre machine hôte. Utilisez `host.docker.internal` pour les fournisseurs d’IA qui
s’exécutent sur l’hôte :

| Fournisseur | URL par défaut de l’hôte | URL de configuration Docker          |
| ----------- | ------------------------ | ------------------------------------ |
| LM Studio   | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`   |
| Ollama      | `http://127.0.0.1:11434` | `http://host.docker.internal:11434`  |

La configuration Docker intégrée utilise ces URL d’hôte comme valeurs par défaut d’intégration
LM Studio et Ollama, et `docker-compose.yml` mappe `host.docker.internal` au
Gateway hôte de Docker pour Docker Engine sous Linux. Docker Desktop fournit déjà
le même nom d’hôte sous macOS et Windows.

Les services de l’hôte doivent aussi écouter sur une adresse accessible depuis Docker :

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si vous utilisez votre propre fichier Compose ou commande `docker run`, ajoutez vous-même le même
mappage d’hôte, par exemple
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Le réseau bridge Docker ne transmet généralement pas de manière fiable le multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configuration Compose intégrée définit donc par défaut
`OPENCLAW_DISABLE_BONJOUR=1` afin que le Gateway ne boucle pas sur des plantages ou ne redémarre pas
l’annonce de manière répétée lorsque le bridge laisse tomber le trafic multicast.

Utilisez l’URL Gateway publiée, Tailscale ou DNS-SD à portée étendue pour les hôtes Docker.
Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement lors de l’exécution avec un réseau hôte, macvlan,
ou un autre réseau où le multicast mDNS est connu pour fonctionner.

Pour les pièges et le dépannage, consultez [Découverte Bonjour](/fr/gateway/bonjour).

### Stockage et persistance

Docker Compose monte par bind `OPENCLAW_CONFIG_DIR` sur `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` sur `/home/node/.openclaw/workspace`, afin que ces chemins
survivent au remplacement du conteneur. Quand l’une des variables n’est pas définie, le
`docker-compose.yml` intégré se rabat sur `${HOME}/.openclaw` (et
`${HOME}/.openclaw/workspace` pour le montage de l’espace de travail), ou `/tmp/.openclaw`
lorsque `HOME` lui-même est également manquant. Cela empêche `docker compose up`
d’émettre une spécification de volume à source vide dans les environnements nus.

Ce répertoire de configuration monté est l’endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé API des fournisseurs stockée
- `.env` pour les secrets d’exécution basés sur l’environnement tels que `OPENCLAW_GATEWAY_TOKEN`

Les dépendances d’exécution des plugins groupés et les fichiers d’exécution
mis en miroir sont un état généré, pas une configuration utilisateur. Compose
les stocke dans le volume Docker nommé `openclaw-plugin-runtime-deps`, monté à
`/var/lib/openclaw/plugin-runtime-deps`. Garder cette arborescence à fort
renouvellement hors du montage lié de configuration de l’hôte évite les
opérations de fichiers lentes de Docker Desktop/WSL et les handles Windows
obsolètes pendant le démarrage à froid du Gateway.

Le fichier Compose par défaut définit `OPENCLAW_PLUGIN_STAGE_DIR` sur ce chemin
pour `openclaw-gateway` comme pour `openclaw-cli`, de sorte que `openclaw doctor --fix`,
les commandes de connexion/configuration des canaux et le démarrage du Gateway
utilisent tous le même volume d’exécution généré.

Pour tous les détails de persistance sur les déploiements de VM, consultez
[Exécution Docker VM - Ce qui persiste où](/fr/install/docker-vm-runtime#what-persists-where).

**Points sensibles de croissance du disque :** surveillez `media/`, les fichiers JSONL de session, `cron/runs/*.jsonl`,
le volume Docker `openclaw-plugin-runtime-deps` et les journaux de fichiers tournants sous
`/tmp/openclaw/`.

### Assistants shell (facultatif)

Pour faciliter la gestion quotidienne de Docker, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock depuis l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, relancez la commande d’installation ci-dessus afin que votre fichier d’assistance local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Consultez [ClawDock](/fr/install/clawdock) pour le guide complet des assistants.

<AccordionGroup>
  <Accordion title="Activer le bac à sable d’agent pour le Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Chemin de socket personnalisé (par exemple Docker sans root) :

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Le script ne monte `docker.sock` qu’une fois les prérequis du bac à sable validés. Si
    la configuration du bac à sable ne peut pas se terminer, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation de pseudo-TTY Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Note de sécurité sur le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes
    CLI puissent atteindre le Gateway via `127.0.0.1`. Traitez cela comme une frontière de
    confiance partagée. La configuration Compose supprime `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Autorisations et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous voyez des erreurs d’autorisation sur
    `/home/node/.openclaw`, assurez-vous que vos montages liés hôte appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Ordonnez votre Dockerfile de façon à mettre les couches de dépendances en cache. Cela évite de relancer
    `pnpm install` sauf si les fichiers de verrouillage changent :

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
    4. **Persister les téléchargements de navigateurs** : définissez
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` et utilisez
       `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker sans interface)">
    Si vous choisissez OAuth OpenAI Codex dans l’assistant, il ouvre une URL de navigateur. Dans
    Docker ou les configurations sans interface, copiez l’URL complète de redirection sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image d’exécution Docker principale utilise `node:24-bookworm-slim` et publie des annotations OCI
    d’image de base, notamment `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` et d’autres. Le condensat de base Node est
    actualisé via les PR Dependabot d’image de base Docker ; les builds de version n’exécutent pas
    de couche de mise à niveau de distribution. Voir
    [annotations d’image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Consultez [Hetzner (VPS Docker)](/fr/install/hetzner) et
[Exécution Docker VM](/fr/install/docker-vm-runtime) pour les étapes de déploiement de VM partagée,
notamment l’intégration du binaire, la persistance et les mises à jour.

## Bac à sable d’agent

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, le Gateway
exécute les outils d’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker
isolés, tandis que le Gateway lui-même reste sur l’hôte. Cela vous donne une barrière solide
autour des sessions d’agent non fiables ou mutualisées sans conteneuriser tout le
Gateway.

La portée du bac à sable peut être par agent (par défaut), par session ou partagée. Chaque portée
obtient son propre espace de travail monté sur `/workspace`. Vous pouvez également configurer
des politiques d’autorisation/refus d’outils, l’isolation réseau, des limites de ressources et des conteneurs
de navigateur.

Pour la configuration complète, les images, les notes de sécurité et les profils multi-agents, consultez :

- [Bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs de bac à sable
- [Bac à sable multi-agents et outils](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

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

Construisez l’image de bac à sable par défaut :

```bash
scripts/sandbox-setup.sh
```

## Dépannage

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur de bac à sable qui ne démarre pas">
    Construisez l’image de bac à sable avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs d’autorisation dans le bac à sable">
    Définissez `docker.user` sur un UID:GID correspondant au propriétaire de votre espace de travail monté,
    ou modifiez le propriétaire du dossier d’espace de travail avec chown.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans le bac à sable">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), ce qui source
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Processus tué pour dépassement de mémoire pendant le build d’image (exit 137)">
    La VM a besoin d’au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans la Control UI">
    Récupérez un nouveau lien de tableau de bord et approuvez l’appareil du navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Tableau de bord](/fr/web/dashboard), [Appareils](/fr/cli/devices).

  </Accordion>

  <Accordion title="La cible Gateway affiche ws://172.x.x.x ou des erreurs d’appairage depuis la CLI Docker">
    Réinitialisez le mode et la liaison du Gateway :

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Podman](/fr/install/podman) — alternative Podman à Docker
- [ClawDock](/fr/install/clawdock) — configuration communautaire Docker Compose
- [Mise à jour](/fr/install/updating) — maintenir OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration du Gateway après l’installation
