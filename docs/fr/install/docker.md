---
read_when:
    - Vous voulez une Gateway conteneurisée plutôt que des installations locales
    - Vous validez le flux Docker
summary: Configuration et prise en main facultatives basées sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T07:11:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2647caae7debfe0647842249a3a6000bfa73b191b1aa1d7ced1e9c0eb22228db
    source_path: install/docker.md
    workflow: 16
---

Docker est **facultatif**. Utilisez-le uniquement si vous voulez un Gateway conteneurisé ou valider le flux Docker.

## Docker est-il adapté à mon cas ?

- **Oui** : vous voulez un environnement de Gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous exécutez OpenClaw sur votre propre machine et voulez simplement le cycle de développement le plus rapide. Utilisez plutôt le flux d’installation normal.
- **Note sur le bac à sable** : le backend de bac à sable par défaut utilise Docker lorsque le bac à sable est activé, mais le bac à sable est désactivé par défaut et n’exige **pas** que le Gateway complet s’exécute dans Docker. Les backends de bac à sable SSH et OpenShell sont également disponibles. Consultez [Bac à sable](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l’image (`pnpm install` peut être tué par manque de mémoire sur les hôtes de 1 Go avec la sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- Si vous l’exécutez sur un VPS/hôte public, consultez
  [Renforcement de la sécurité pour l’exposition réseau](/fr/gateway/security),
  en particulier la stratégie de pare-feu Docker `DOCKER-USER`.

## Gateway conteneurisé

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt, exécutez le script de configuration :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit l’image du Gateway localement. Pour utiliser une image préconstruite à la place :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont publiées dans le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Balises courantes : `main`, `latest`, `<version>` (par exemple `2026.2.26`).

  </Step>

  <Step title="Terminer l’intégration">
    Le script de configuration exécute automatiquement l’intégration. Il va :

    - demander les clés d’API du fournisseur
    - générer un jeton de Gateway et l’écrire dans `.env`
    - démarrer le Gateway via Docker Compose

    Pendant la configuration, l’intégration avant démarrage et les écritures de configuration passent directement par
    `openclaw-gateway`. `openclaw-cli` sert aux commandes que vous exécutez après
    que le conteneur du Gateway existe déjà.

  </Step>

  <Step title="Ouvrir l’interface de contrôle">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le secret
    partagé configuré dans les paramètres. Le script de configuration écrit un jeton dans `.env` par
    défaut ; si vous basculez la configuration du conteneur vers une authentification par mot de passe, utilisez ce
    mot de passe à la place.

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
Comme `openclaw-cli` partage l’espace de noms réseau de `openclaw-gateway`, c’est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’intégration
et les écritures de configuration au moment de la configuration via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                                   | Objectif                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Utiliser une image distante au lieu de construire localement    |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installer des paquets apt supplémentaires pendant la construction (séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`                      | Inclure les helpers de Plugin groupés sélectionnés au moment de la construction |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montages bind hôte supplémentaires (`source:target[:opts]` séparés par des virgules) |
| `OPENCLAW_HOME_VOLUME`                     | Persister `/home/node` dans un volume Docker nommé             |
| `OPENCLAW_SANDBOX`                         | Activer explicitement l’amorçage du bac à sable (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | Ignorer l’étape d’intégration interactive (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Remplacer le chemin du socket Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | Désactiver la publicité Bonjour/mDNS (`1` par défaut pour Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Désactiver les superpositions de montage bind de source des Plugins groupés |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Point de terminaison collecteur OTLP/HTTP partagé pour l’export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Points de terminaison OTLP propres au signal pour les traces, les métriques ou les journaux |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Remplacement du protocole OTLP. Seul `http/protobuf` est pris en charge aujourd’hui |
| `OTEL_SERVICE_NAME`                        | Nom de service utilisé pour les ressources OpenTelemetry       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Activer explicitement les derniers attributs sémantiques GenAI expérimentaux |
| `OPENCLAW_OTEL_PRELOADED`                  | Ignorer le démarrage d’un second SDK OpenTelemetry lorsqu’un SDK est préchargé |

Les mainteneurs peuvent tester la source d’un Plugin groupé avec une image empaquetée en montant
un répertoire source de Plugin sur son chemin source empaqueté, par exemple
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ce répertoire source monté remplace le bundle compilé correspondant
`/app/dist/extensions/synology-chat` pour le même identifiant de Plugin.

### Observabilité

L’export OpenTelemetry sort du conteneur Gateway vers votre collecteur OTLP.
Il ne nécessite pas de port Docker publié. Si vous construisez l’image
localement et voulez que l’exporteur OpenTelemetry groupé soit disponible dans l’image,
incluez ses dépendances d’exécution :

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

L’image de version Docker officielle d’OpenClaw inclut la source du Plugin groupé
`diagnostics-otel`. Pour activer l’export, autorisez et activez le
Plugin `diagnostics-otel` dans la configuration, puis définissez
`diagnostics.otel.enabled=true` ou utilisez l’exemple de configuration dans
[Export OpenTelemetry](/fr/gateway/opentelemetry). Les en-têtes d’authentification du collecteur sont
configurés via `diagnostics.otel.headers`, pas via les variables d’environnement
Docker.

Les métriques Prometheus utilisent le port Gateway déjà publié. Activez le
Plugin `diagnostics-prometheus`, puis scrapez :

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route est protégée par l’authentification du Gateway. N’exposez pas de port
public `/metrics` séparé ni de chemin de reverse proxy non authentifié. Consultez
[Métriques Prometheus](/fr/gateway/prometheus).

### Contrôles de santé

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L’image Docker inclut un `HEALTHCHECK` intégré qui interroge `/healthz`.
Si les contrôles continuent d’échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané de santé approfondi authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` définit par défaut `OPENCLAW_GATEWAY_BIND=lan`, ce qui permet à l’hôte d’accéder à
`http://127.0.0.1:18789` avec la publication de port Docker.

- `lan` (par défaut) : le navigateur de l’hôte et la CLI de l’hôte peuvent atteindre le port Gateway publié.
- `loopback` : seuls les processus dans l’espace de noms réseau du conteneur peuvent atteindre
  directement le Gateway.

<Note>
Utilisez les valeurs de mode de bind dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), pas des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Fournisseurs locaux de l’hôte

Quand OpenClaw s’exécute dans Docker, `127.0.0.1` dans le conteneur désigne le conteneur
lui-même, pas votre machine hôte. Utilisez `host.docker.internal` pour les fournisseurs IA qui
s’exécutent sur l’hôte :

| Fournisseur | URL hôte par défaut        | URL de configuration Docker          |
| ----------- | -------------------------- | ------------------------------------ |
| LM Studio   | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234`   |
| Ollama      | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434`  |

La configuration Docker groupée utilise ces URL d’hôte comme valeurs par défaut d’intégration
pour LM Studio et Ollama, et `docker-compose.yml` mappe `host.docker.internal` au
Gateway hôte de Docker pour Docker Engine sous Linux. Docker Desktop fournit déjà
le même nom d’hôte sur macOS et Windows.

Les services de l’hôte doivent également écouter sur une adresse accessible depuis Docker :

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si vous utilisez votre propre fichier Compose ou commande `docker run`, ajoutez vous-même le même
mappage d’hôte, par exemple
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Le réseau bridge de Docker ne relaie généralement pas le multicast Bonjour/mDNS
(`224.0.0.251:5353`) de façon fiable. La configuration Compose groupée définit donc par défaut
`OPENCLAW_DISABLE_BONJOUR=1` afin que le Gateway ne boucle pas sur des plantages ou ne
redémarre pas sans cesse la publicité lorsque le bridge abandonne le trafic multicast.

Utilisez l’URL Gateway publiée, Tailscale ou DNS-SD en zone étendue pour les hôtes Docker.
Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement lors de l’exécution avec le réseau de l’hôte, macvlan,
ou un autre réseau où le multicast mDNS est connu pour fonctionner.

Pour les pièges et le dépannage, consultez [Découverte Bonjour](/fr/gateway/bonjour).

### Stockage et persistance

Docker Compose monte en bind `OPENCLAW_CONFIG_DIR` vers `/home/node/.openclaw` et
`OPENCLAW_WORKSPACE_DIR` vers `/home/node/.openclaw/workspace`, de sorte que ces chemins
survivent au remplacement du conteneur. Quand l’une ou l’autre variable n’est pas définie, le fichier
`docker-compose.yml` groupé se rabat sur `${HOME}/.openclaw` (et
`${HOME}/.openclaw/workspace` pour le montage de l’espace de travail), ou `/tmp/.openclaw`
lorsque `HOME` lui-même est également manquant. Cela évite que `docker compose up`
émette une spécification de volume à source vide dans des environnements nus.

Ce répertoire de configuration monté est l’endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé d’API des fournisseurs stockée
- `.env` pour les secrets d’exécution adossés à l’environnement, comme `OPENCLAW_GATEWAY_TOKEN`

Les Plugins téléchargeables installés stockent leur état de paquet sous le répertoire personnel
OpenClaw monté, de sorte que les enregistrements d’installation de Plugins et les racines de paquets survivent au
remplacement du conteneur. Le démarrage du Gateway ne génère pas d’arbres de dépendances de Plugins groupés.

Pour les détails complets de persistance sur les déploiements VM, consultez
[Runtime VM Docker - Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session,
`cron/runs/*.jsonl`, les racines de paquets de Plugins installés et les journaux de fichiers tournants
sous `/tmp/openclaw/`.

### Helpers shell (facultatif)

Pour une gestion quotidienne plus simple de Docker, installez `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock depuis l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, réexécutez la commande d’installation ci-dessus afin que votre fichier d’aide local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Consultez [ClawDock](/fr/install/clawdock) pour le guide complet des assistants.

<AccordionGroup>
  <Accordion title="Activer le bac à sable de l’agent pour le Gateway Docker">
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

    Le script monte `docker.sock` uniquement après validation des prérequis du bac à sable. Si
    la configuration du bac à sable ne peut pas être terminée, le script réinitialise `agents.defaults.sandbox.mode`
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
    puissent atteindre le Gateway via `127.0.0.1`. Traitez cela comme une limite de confiance
    partagée. La configuration Compose retire `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous voyez des erreurs de permission sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind côté hôte appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Organisez votre Dockerfile afin que les couches de dépendances soient mises en cache. Cela évite de relancer
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
    L’image par défaut privilégie la sécurité et s’exécute en tant que `node` non-root. Pour un conteneur plus
    complet :

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

  <Accordion title="OpenAI Codex OAuth (Docker sans interface graphique)">
    Si vous choisissez OpenAI Codex OAuth dans l’assistant, une URL de navigateur s’ouvre. Dans
    Docker ou les configurations sans interface graphique, copiez l’URL de redirection complète sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image principale d’exécution Docker utilise `node:24-bookworm-slim` et publie des annotations OCI
    d’image de base, notamment `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` et d’autres. Le digest de base Node est
    actualisé via les PR Dependabot d’image de base Docker ; les builds de publication n’exécutent pas
    de couche de mise à niveau de distribution. Consultez
    [Annotations d’image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Consultez [Hetzner (VPS Docker)](/fr/install/hetzner) et
[Environnement d’exécution Docker VM](/fr/install/docker-vm-runtime) pour les étapes de déploiement sur VM partagée,
notamment l’intégration du binaire, la persistance et les mises à jour.

## Bac à sable de l’agent

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, le Gateway
exécute les outils d’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker
isolés tandis que le Gateway lui-même reste sur l’hôte. Cela vous donne une séparation stricte
autour des sessions d’agent non fiables ou multi-locataires sans conteneuriser l’ensemble du
Gateway.

La portée du bac à sable peut être par agent (par défaut), par session ou partagée. Chaque portée
obtient son propre espace de travail monté sur `/workspace`. Vous pouvez aussi configurer
des politiques d’autorisation/refus d’outils, l’isolation réseau, des limites de ressources et des conteneurs
de navigateur.

Pour la configuration complète, les images, les notes de sécurité et les profils multi-agents, consultez :

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du bac à sable
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs de bac à sable
- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

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

Construisez l’image de bac à sable par défaut (depuis un checkout source) :

```bash
scripts/sandbox-setup.sh
```

Pour les installations npm sans checkout source, consultez [Sandboxing § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

## Dépannage

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur de bac à sable qui ne démarre pas">
    Construisez l’image de bac à sable avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout source) ou la commande `docker build` en ligne depuis [Sandboxing § Images et configuration](/fr/gateway/sandboxing#images-and-setup) (installation npm),
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs de permission dans le bac à sable">
    Définissez `docker.user` sur un UID:GID correspondant au propriétaire de votre espace de travail monté,
    ou exécutez chown sur le dossier de l’espace de travail.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans le bac à sable">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), ce qui charge
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Arrêt par OOM pendant la construction de l’image (exit 137)">
    La VM a besoin d’au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans Control UI">
    Récupérez un nouveau lien de tableau de bord et approuvez l’appareil navigateur :

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

## Associé

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Podman](/fr/install/podman) — alternative Podman à Docker
- [ClawDock](/fr/install/clawdock) — configuration communautaire Docker Compose
- [Mise à jour](/fr/install/updating) — maintenir OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration du Gateway après installation
