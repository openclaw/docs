---
read_when:
    - Vous souhaitez un Gateway conteneurisé plutôt que des installations locales
    - Vous validez le flux Docker
summary: Configuration et intégration facultatives basées sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-12T15:31:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker est **facultatif**. Utilisez-le pour disposer d’un environnement Gateway isolé et jetable, ou sur un hôte dépourvu d’installations locales. Si vous développez déjà sur votre propre machine, utilisez plutôt le processus d’installation normal.

Le backend de bac à sable par défaut utilise Docker lorsque `agents.defaults.sandbox` est activé, mais le bac à sable est désactivé par défaut et n’exige pas que le Gateway lui-même s’exécute dans Docker. Les backends de bac à sable SSH et OpenShell sont également disponibles ; consultez [Mise en bac à sable](/fr/gateway/sandboxing).

Vous hébergez plusieurs utilisateurs ? Consultez [Hébergement mutualisé](/fr/gateway/multi-tenant-hosting) pour le modèle d’une cellule par locataire.

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 GB de RAM pour construire l’image (`pnpm install` peut être interrompu par manque de mémoire sur les hôtes disposant de 1 GB, avec le code de sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- Sur un VPS ou un hôte public, consultez [Renforcement de la sécurité pour l’exposition réseau](/fr/gateway/security), en particulier la chaîne de pare-feu Docker `DOCKER-USER`

## Gateway conteneurisé

<Steps>
  <Step title="Construire l’image">
    Depuis la racine du dépôt :

    ```bash
    ./scripts/docker/setup.sh
    ```

    Cela construit localement l’image du Gateway sous le nom `openclaw:local`. Pour utiliser plutôt une image préconstruite :

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Les images préconstruites sont d’abord publiées dans le [registre de conteneurs GitHub](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR est le registre principal pour l’automatisation des versions, les déploiements épinglés et les vérifications de provenance. La même version publie une copie miroir sur Docker Hub sous `openclaw/openclaw` :

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Utilisez `ghcr.io/openclaw/openclaw` ou `openclaw/openclaw` et évitez les miroirs non officiels, qui ne partagent ni le calendrier de publication ni la politique de conservation d’OpenClaw. Étiquettes officielles : `main`, `latest`, `<version>` (par exemple `2026.2.26`) et les étiquettes bêta telles que `2026.2.26-beta.1` (les versions bêta ne déplacent jamais `latest`/`main`). L’image par défaut `main`/`latest`/`<version>` inclut les plugins `codex` et `diagnostics-otel`. Une variante `-browser` (par exemple `latest-browser`) est également fournie avec Chromium préinstallé, ce qui est utile pour l’outil de [navigateur en bac à sable](/fr/gateway/sandboxing#sandboxed-browser) sans installation de Playwright lors de la première exécution.

  </Step>

  <Step title="Réexécuter hors connexion">
    Sur les hôtes hors connexion, transférez et chargez d’abord l’image :

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` vérifie que `OPENCLAW_IMAGE` existe déjà localement, désactive les extractions et constructions implicites de Compose, puis exécute le processus normal : synchronisation de `.env`, correction des autorisations, intégration initiale, synchronisation de la configuration du Gateway et démarrage de Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuration hors connexion vérifie également les images de bac à sable configurées par défaut et par agent sur le démon derrière `OPENCLAW_DOCKER_SOCKET`, y compris l’étiquette de contrat du navigateur sur les images de navigateur basées sur Docker. Si une image requise est absente ou obsolète, la configuration se termine sans modifier la configuration du bac à sable au lieu d’indiquer à tort une réussite.

  </Step>

  <Step title="Terminer l’intégration initiale">
    Le script de configuration exécute automatiquement l’intégration initiale :

    - demande les clés d’API du fournisseur
    - génère un jeton de Gateway et l’écrit dans `.env`
    - crée le répertoire de la clé secrète du profil d’authentification
    - démarre le Gateway via Docker Compose

    L’intégration initiale et les écritures de configuration préalables au démarrage s’exécutent directement via `openclaw-gateway` (avec `--no-deps --entrypoint node`), car `openclaw-cli` partage l’espace de noms réseau du Gateway et ne fonctionne qu’une fois le conteneur du Gateway créé.

  </Step>

  <Step title="Ouvrir l’interface de contrôle">
    Ouvrez `http://127.0.0.1:18789/` et collez dans Settings le jeton écrit dans `.env`. Si vous avez configuré le conteneur pour utiliser l’authentification par mot de passe, utilisez plutôt ce mot de passe.

    Vous avez de nouveau besoin de l’URL ?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurer les canaux (facultatif)">
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

### Processus manuel

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Le contexte Docker exclut `.git`. Transmettez l’identité de la source comme arguments de construction,
comme illustré ci-dessus, afin que l’écran À propos de l’image indique le commit extrait et
un horodatage de construction. `scripts/docker/setup.sh` détermine et transmet automatiquement
ces deux valeurs.

<Note>
Exécutez `docker compose` depuis la racine du dépôt. Si vous avez activé `OPENCLAW_EXTRA_MOUNTS` ou `OPENCLAW_HOME_VOLUME`, le script de configuration écrit `docker-compose.extra.yml` ; incluez-le après tout fichier `docker-compose.override.yml` que vous gérez vous-même, par exemple `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Mise à niveau des images de conteneur

Lorsque vous remplacez l’image OpenClaw tout en conservant le même état et la même configuration montés, le
nouveau Gateway exécute avant d’être prêt les migrations de mise à niveau sûres au démarrage et la convergence
des plugins. Les mises à niveau ordinaires des images ne devraient pas nécessiter une exécution distincte de
`openclaw doctor --fix`.

Si le démarrage ne peut pas effectuer ces réparations en toute sécurité, le Gateway se ferme au lieu de
signaler qu’il est opérationnel. Avec une politique de redémarrage, Docker, Podman ou Kubernetes peut indiquer
que le conteneur du Gateway redémarre. Conservez le volume d’état monté, puis exécutez
une fois la même image avec `openclaw doctor --fix` comme commande du conteneur, en utilisant les
mêmes montages d’état et de configuration que le Gateway :

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Une fois doctor terminé, redémarrez le conteneur du Gateway avec sa commande par défaut.
Dans Kubernetes, exécutez la même commande dans un Job ponctuel ou un pod de débogage monté sur le
même PVC, puis redémarrez le Deployment ou le StatefulSet.

### Variables d’environnement

Variables facultatives acceptées par `scripts/docker/setup.sh` (et, pour le conteneur du Gateway, directement par `docker-compose.yml`) :

| Variable                                        | Objectif                                                                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Utiliser une image distante au lieu de la construire localement                                                                     |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Installer des paquets apt supplémentaires pendant la construction (séparés par des espaces). Ancien alias : `OPENCLAW_DOCKER_APT_PACKAGES` |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Installer des paquets Python supplémentaires pendant la construction (séparés par des espaces)                                      |
| `OPENCLAW_EXTENSIONS`                           | Compiler/empaqueter les plugins pris en charge sélectionnés et installer leurs dépendances d’exécution (identifiants séparés par des virgules ou des espaces) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Remplacer les options Node de la construction locale depuis les sources (valeur par défaut : `--max-old-space-size=8192`)           |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Remplacer la taille du tas tsdown de la construction locale depuis les sources, en MB                                               |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Ignorer la génération des déclarations pendant les constructions locales d’images limitées à l’exécution (valeur par défaut : `1`) |
| `OPENCLAW_INSTALL_BROWSER`                      | Intégrer Chromium + Xvfb à l’image lors de la construction                                                                           |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montages liés supplémentaires de l’hôte (valeurs `source:target[:opts]` séparées par des virgules)                                  |
| `OPENCLAW_HOME_VOLUME`                          | Conserver `/home/node` dans un volume Docker nommé                                                                                   |
| `OPENCLAW_SANDBOX`                              | Activer l’amorçage du bac à sable (`1`, `true`, `yes`, `on`)                                                                        |
| `OPENCLAW_SKIP_ONBOARDING`                      | Ignorer l’étape interactive d’intégration initiale (`1`, `true`, `yes`, `on`)                                                       |
| `OPENCLAW_DOCKER_SOCKET`                        | Remplacer le chemin du socket Docker                                                                                                 |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forcer l’activation (`0`) ou la désactivation (`1`) de la diffusion Bonjour/mDNS ; consultez [Bonjour / mDNS](#bonjour--mdns)       |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Désactiver les superpositions de montages liés des sources des plugins inclus                                                       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Point de terminaison partagé du collecteur OTLP/HTTP pour l’exportation OpenTelemetry                                               |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Points de terminaison OTLP propres à chaque signal pour les traces, les métriques ou les journaux                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Remplacement du protocole OTLP. Seul `http/protobuf` est actuellement pris en charge                                                |
| `OTEL_SERVICE_NAME`                             | Nom du service utilisé pour les ressources OpenTelemetry                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Activer les derniers attributs sémantiques expérimentaux de GenAI                                                                  |
| `OPENCLAW_OTEL_PRELOADED`                       | Éviter de démarrer un deuxième SDK OpenTelemetry lorsqu’un autre est préchargé                                                      |

L’image officielle ne contient pas Homebrew. Pendant l’intégration initiale, OpenClaw masque les programmes d’installation des dépendances de Skills réservés à brew dans un conteneur Linux dépourvu de `brew` ; fournissez ces dépendances au moyen d’une image personnalisée ou installez-les manuellement. Utilisez `OPENCLAW_IMAGE_APT_PACKAGES` pour les dépendances empaquetées pour Debian et `OPENCLAW_IMAGE_PIP_PACKAGES` pour les dépendances Python (exécute `python3 -m pip install --break-system-packages` lors de la construction ; épinglez donc les versions et utilisez uniquement des index auxquels vous faites confiance).

Si Docker signale `ResourceExhausted`, `cannot allocate memory`, ou s’interrompt pendant `tsdown`, augmentez la limite de mémoire du constructeur Docker ou réessayez avec des tas explicites plus petits :

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Images construites depuis les sources avec des plugins sélectionnés

`OPENCLAW_EXTENSIONS` sélectionne les identifiants de manifeste de Plugin dans le dépôt source ;
les noms de répertoires source existants sont également acceptés lorsqu’ils diffèrent. La construction
Docker résout une seule fois la sélection en répertoires source, installe les dépendances
de production et, lorsqu’un Plugin sélectionné est publié séparément avec
`openclaw.build.bundledDist: false`, compile son environnement d’exécution dans le répertoire
dist groupé racine. Ce conditionnement propre à Docker ne modifie pas le contrat d’artefact npm
ou ClawHub du Plugin. Les identifiants inconnus, non valides ou ambigus font échouer la construction
de l’image. Les identifiants connus réservés aux dépendances ou aux sources conservent leur préparation
existante des sources et des dépendances sans obtenir d’entrée dist racine compilée. Un Plugin
sélectionné avec des entrées de construction unifiées doit être compilé correctement ; les sources
et la sortie d’exécution des Plugins externes non sélectionnés sont supprimées.

Par exemple, ces commandes construisent des images Gateway autonomes, distinctes et
multi-architectures de FakeCo pour ClickClack, Slack et Microsoft Teams. ClawRouter fait
déjà partie de l’environnement d’exécution OpenClaw racine ; l’image ClickClack sélectionne donc
uniquement `clickclack`. L’argument de navigateur explicitement vide permet de conserver
l’image par défaut sans Chromium :

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Utilisez `--platform linux/arm64 --load` ou `--platform linux/amd64 --load` pour une
seule construction locale native. Une sortie multiplateforme ainsi que les SBOM et données
de provenance joints nécessitent un registre ou une autre sortie Buildx qui préserve les
attestations. Après l’envoi, inspectez le manifeste et déployez le condensat immuable plutôt
que l’étiquette mutable fondée sur le SHA source :

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Déployer : registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Ces images sont destinées aux Gateway autonomes fondés sur OCI et aux utilisateurs
génériques de Docker. Les Gateway gérés par Crabhelm ne les utilisent pas : ce chemin
de livraison construit une archive d’appliance x86_64 distincte contenant une archive
tar npm OpenClaw et épingle les condensats de Node, de l’archive et du manifeste.
Construisez cette appliance séparément à partir de la même source OpenClaw intégrée.

Pour tester la source d’un Plugin groupé avec une image conditionnée, montez un répertoire source du Plugin sur son chemin source conditionné, par exemple `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Cela remplace le paquet compilé `/app/dist/extensions/synology-chat` correspondant pour le même identifiant de Plugin.

### Observabilité

L’export OpenTelemetry est sortant depuis le conteneur Gateway vers votre collecteur OTLP ; il ne nécessite aucun port Docker publié. Pour inclure l’exportateur groupé dans une image construite localement :

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Les images officielles préconstruites incluent déjà `diagnostics-otel` ; installez vous-même `clawhub:@openclaw/diagnostics-otel` uniquement si vous l’avez supprimé. Pour activer l’export, autorisez et activez le Plugin `diagnostics-otel` dans la configuration, puis définissez `diagnostics.otel.enabled=true` (consultez l’exemple complet dans [Export OpenTelemetry](/fr/gateway/opentelemetry)). Les en-têtes d’authentification du collecteur passent par `diagnostics.otel.headers`, et non par les variables d’environnement Docker.

Les métriques Prometheus réutilisent le port Gateway déjà publié. Installez `clawhub:@openclaw/diagnostics-prometheus`, activez le Plugin `diagnostics-prometheus`, puis collectez :

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route est protégée par l’authentification du Gateway ; n’exposez pas de port public `/metrics` distinct ni de chemin de proxy inverse non authentifié. Consultez [Métriques Prometheus](/fr/gateway/prometheus).

### Contrôles d’intégrité

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # activité
curl -fsS http://127.0.0.1:18789/readyz     # disponibilité
```

Le `HEALTHCHECK` intégré de l’image interroge `/healthz` ; des échecs répétés marquent le conteneur comme `unhealthy` afin que les orchestrateurs puissent le redémarrer ou le remplacer.

Instantané d’intégrité approfondi authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ou interface de bouclage

`scripts/docker/setup.sh` utilise par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que `http://127.0.0.1:18789` sur l’hôte fonctionne avec la publication de ports Docker.

- `lan` (par défaut) : le navigateur et la CLI de l’hôte peuvent atteindre le port Gateway publié.
- `loopback` : seuls les processus situés dans l’espace de noms réseau du conteneur peuvent atteindre directement le Gateway.

<Note>
Utilisez les valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), et non des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Fournisseurs locaux de l’hôte

Dans le conteneur, `127.0.0.1` désigne le conteneur lui-même, et non l’hôte. Utilisez `host.docker.internal` pour les fournisseurs exécutés sur l’hôte :

| Fournisseur | URL par défaut de l’hôte | URL de configuration Docker         |
| ----------- | ------------------------- | ----------------------------------- |
| LM Studio   | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama      | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

La configuration groupée utilise ces URL comme valeurs par défaut d’intégration de LM Studio/Ollama, et `docker-compose.yml` associe `host.docker.internal` au Gateway de l’hôte sur Docker Engine pour Linux (Docker Desktop fournit le même alias sous macOS/Windows). Les services de l’hôte doivent écouter sur une adresse accessible par Docker :

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Vous utilisez votre propre fichier Compose ou `docker run` ? Ajoutez vous-même la même association, par exemple `--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI dans Docker

L’image officielle ne préinstalle pas Claude Code. Installez-le et connectez-vous dans le conteneur avec l’utilisateur `node`, puis rendez persistant le répertoire personnel de ce conteneur afin que les mises à niveau de l’image n’effacent pas le binaire ni l’état d’authentification.

Pour une nouvelle installation, activez un volume persistant `/home/node` avant d’exécuter la configuration :

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Pour une installation existante, arrêtez la pile et rechargez d’abord les valeurs actuelles de `.env` — le script de configuration réécrit toujours `.env` à partir de l’environnement actuel du shell et des valeurs par défaut ; il ne lit pas ce fichier de lui-même :

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si `.env` contient des valeurs que votre shell ne peut pas charger, réexportez d’abord manuellement celles dont vous dépendez (`OPENCLAW_IMAGE`, ports, mode de liaison, chemins personnalisés, `OPENCLAW_EXTRA_MOUNTS`, bac à sable, omission de l’intégration). La surcouche générée monte le volume du répertoire personnel pour `openclaw-gateway` et `openclaw-cli` ; exécutez les commandes restantes avec cette surcouche (et d’abord `docker-compose.override.yml`, si vous en utilisez un) :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Le programme d’installation natif écrit `claude` dans `/home/node/.local/bin/claude`. Indiquez ce chemin à OpenClaw :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Connectez-vous et vérifiez depuis le même répertoire personnel persistant :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Utilisez ensuite le backend `claude-cli` groupé :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Dites bonjour depuis la CLI Claude dans Docker"
```

`OPENCLAW_HOME_VOLUME` rend persistants l’installation native sous `/home/node/.local/bin` et `/home/node/.local/share/claude`, ainsi que les paramètres et l’authentification de Claude Code sous `/home/node/.claude` et `/home/node/.claude.json`. Rendre persistant uniquement `/home/node/.openclaw` ne suffit pas ; si vous utilisez `OPENCLAW_EXTRA_MOUNTS` au lieu d’un volume de répertoire personnel, montez tous ces chemins Claude dans les deux services.

<Note>
Pour une automatisation de production partagée ou une facturation Anthropic prévisible, préférez l’utilisation d’une clé d’API Anthropic. La réutilisation de Claude CLI suit la version installée de Claude Code, la connexion au compte, la facturation et le comportement de mise à jour.
</Note>

### Bonjour / mDNS

Le réseau en pont de Docker ne transmet généralement pas de manière fiable le multicast Bonjour/mDNS (`224.0.0.251:5353`). Lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, le Plugin Bonjour groupé désactive automatiquement la diffusion LAN dès qu’il détecte son exécution dans un conteneur, afin d’éviter une boucle de plantage due aux nouvelles tentatives de multicast abandonnées par le pont. Définissez `OPENCLAW_DISABLE_BONJOUR=1` pour forcer sa désactivation indépendamment de la détection, ou `0` pour forcer son activation (uniquement avec le réseau de l’hôte, macvlan ou un autre réseau où le multicast mDNS est réputé fonctionner).

Sinon, utilisez l’URL Gateway publiée, Tailscale ou le DNS-SD étendu pour les hôtes Docker. Consultez [Découverte Bonjour](/fr/gateway/bonjour) pour connaître les pièges et les procédures de dépannage.

### Stockage et persistance

Docker Compose monte par liaison `OPENCLAW_CONFIG_DIR` sur `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` sur `/home/node/.openclaw/workspace` et `OPENCLAW_AUTH_PROFILE_SECRET_DIR` sur `/home/node/.config/openclaw`, afin que ces chemins survivent au remplacement du conteneur. Lorsqu’une variable n’est pas définie, `docker-compose.yml` utilise un chemin de secours sous `${HOME}`, ou sous `/tmp` si `HOME` lui-même est absent, de sorte que `docker compose up` ne génère jamais de spécification de volume avec une source vide dans les environnements minimaux.

Ce répertoire de configuration monté contient :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/par clé d’API stockée des fournisseurs
- `.env` pour les secrets d’exécution fournis par l’environnement, tels que `OPENCLAW_GATEWAY_TOKEN`

Le répertoire de secrets des profils d’authentification stocke la clé de chiffrement locale du contenu des jetons de profils d’authentification fondés sur OAuth. Conservez-le avec l’état de votre hôte Docker, mais séparément de `OPENCLAW_CONFIG_DIR`.

Les Plugins téléchargeables installés stockent l’état de leurs paquets sous le répertoire personnel OpenClaw monté, de sorte que les enregistrements d’installation et les racines des paquets survivent au remplacement du conteneur ; le démarrage du Gateway ne régénère pas les arborescences de dépendances des Plugins groupés.

Pour obtenir tous les détails sur la persistance des machines virtuelles, consultez [Environnement d’exécution de machine virtuelle Docker — Emplacements des données persistantes](/fr/install/docker-vm-runtime#what-persists-where).

**Principales sources de croissance du disque :** `media/`, les bases de données SQLite propres à chaque agent, les transcriptions JSONL de sessions héritées, la base de données d’état SQLite partagée, les racines de paquets des Plugins installés et les journaux de fichiers tournants sous `/tmp/openclaw/`.

### Assistants shell (facultatif)

Pour raccourcir les commandes quotidiennes, installez [ClawDock](/fr/install/clawdock) :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez effectué l’installation depuis l’ancien chemin `scripts/shell-helpers/clawdock-helpers.sh`, réexécutez la commande ci-dessus afin que votre assistant local suive l’emplacement actuel. Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. (exécutez `clawdock-help` pour obtenir la liste complète).

<AccordionGroup>
  <Accordion title="Activer le bac à sable de l’agent pour le Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Chemin de socket personnalisé (par exemple, Docker sans privilèges root) :

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Le script monte `docker.sock` uniquement une fois les prérequis du bac à sable validés. Si la configuration du bac à sable ne peut pas aboutir, il réinitialise `agents.defaults.sandbox.mode` à `off`. Le mode code de Codex est désactivé pour les tours durant lesquels le bac à sable OpenClaw est actif (voir [Mise en bac à sable § Backend Docker](/fr/gateway/sandboxing#docker-backend)) ; ne montez jamais le socket Docker de l’hôte dans les conteneurs de bac à sable des agents.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation de pseudo-TTY par Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Remarque de sécurité concernant le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes CLI puissent atteindre le Gateway via `127.0.0.1`. Considérez cela comme une frontière de confiance partagée. La configuration Compose retire `NET_RAW`/`NET_ADMIN` et active `no-new-privileges` pour `openclaw-gateway` et `openclaw-cli`.
  </Accordion>

  <Accordion title="Échecs DNS de Docker Desktop dans openclaw-cli">
    Certaines configurations de Docker Desktop échouent à effectuer des recherches DNS depuis le conteneur auxiliaire `openclaw-cli` utilisant le réseau partagé après le retrait de `NET_RAW`, ce qui se manifeste par `EAI_AGAIN` pendant les commandes s’appuyant sur npm, telles que `openclaw plugins install`. Conservez le fichier Compose renforcé par défaut pour le fonctionnement normal. La surcharge ci-dessous restaure les capacités par défaut uniquement pour le conteneur `openclaw-cli` : utilisez-la pour la commande ponctuelle nécessitant un accès au registre, et non comme invocation par défaut :

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si vous avez déjà créé un conteneur `openclaw-cli` de longue durée, recréez-le avec la même surcharge : `docker compose exec`/`docker exec` ne peut pas modifier les capacités Linux d’un conteneur déjà créé.

  </Accordion>

  <Accordion title="Autorisations et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous rencontrez des erreurs d’autorisation sur `/home/node/.openclaw`, assurez-vous que vos montages liés depuis l’hôte appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La même incohérence peut se manifester par `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, suivi de `plugin present but blocked` : l’uid du processus et le propriétaire du répertoire du Plugin monté ne correspondent pas. Privilégiez l’exécution avec l’uid 1000 par défaut et corrigez la propriété du montage lié. Ne changez la propriété de `/path/to/openclaw-config/npm` en `root:root` que si vous exécutez intentionnellement OpenClaw en tant que root à long terme.

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Organisez votre Dockerfile de façon à mettre en cache les couches de dépendances, évitant ainsi de réexécuter `pnpm install` sauf si les fichiers de verrouillage changent :

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
    L’image par défaut privilégie la sécurité et s’exécute en tant que `node` non-root. Pour disposer d’un conteneur plus complet :

    1. **Conserver `/home/node`** : `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Intégrer les dépendances système** : `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Intégrer les dépendances Python** : `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Intégrer Chromium pour Playwright** : `export OPENCLAW_INSTALL_BROWSER=1`, ou utilisez l’étiquette d’image officielle `-browser`
    5. **Ou installer les navigateurs Playwright dans un volume persistant** :
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Conserver les téléchargements de navigateurs** : utilisez `OPENCLAW_HOME_VOLUME` ou `OPENCLAW_EXTRA_MOUNTS`. Sous Linux, OpenClaw détecte automatiquement le Chromium de l’image géré par Playwright.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker sans interface graphique)">
    Si vous choisissez OAuth OpenAI Codex dans l’assistant, celui-ci ouvre une URL dans un navigateur. Dans Docker ou les configurations sans interface graphique, copiez l’URL de redirection complète sur laquelle vous arrivez, puis collez-la dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Métadonnées de l’image de base">
    L’image d’exécution utilise `node:24-bookworm-slim` et exécute `tini` en tant que PID 1 afin que les processus zombies soient récupérés et que les signaux soient correctement gérés dans les conteneurs de longue durée. Elle publie des annotations d’image de base OCI, notamment `org.opencontainers.image.base.name` et `org.opencontainers.image.source`. Dependabot actualise le condensat épinglé de l’image de base Node ; les builds de publication n’exécutent pas de couche distincte de mise à niveau de la distribution. Voir [Annotations d’image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Consultez [Hetzner (VPS Docker)](/fr/install/hetzner) et [Environnement d’exécution de VM Docker](/fr/install/docker-vm-runtime) pour connaître les étapes de déploiement sur une VM partagée, notamment l’intégration des binaires, la persistance et les mises à jour.

## Bac à sable de l’agent

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, le Gateway exécute les outils de l’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker isolés, tandis que le Gateway lui-même reste sur l’hôte : une séparation stricte autour des sessions d’agent non fiables ou mutualisées, sans conteneuriser l’ensemble du Gateway.

La portée du bac à sable peut être définie par agent (valeur par défaut), par session ou être partagée ; chaque portée dispose de son propre espace de travail monté dans `/workspace`. Vous pouvez également configurer des politiques d’autorisation ou de refus des outils, l’isolation réseau, les limites de ressources et les conteneurs de navigateur.

Pour obtenir la configuration complète, les images, les remarques de sécurité et les profils multi-agents :

- [Mise en bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable
- [OpenShell](/fr/gateway/openshell) -- accès interactif au shell des conteneurs de bac à sable
- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent

### Activation rapide

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // désactivé | non principal | tous
        scope: "agent", // session | agent | partagé
      },
    },
  },
}
```

Construisez l’image de bac à sable par défaut (depuis un dépôt source extrait) :

```bash
scripts/sandbox-setup.sh
```

Pour les installations npm sans dépôt source extrait, consultez [Mise en bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour obtenir les commandes `docker build` intégrées.

## Dépannage

<AccordionGroup>
  <Accordion title="Image manquante ou conteneur de bac à sable ne démarrant pas">
    Construisez l’image de bac à sable avec [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (dépôt source extrait) ou la commande `docker build` intégrée provenant de [Mise en bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) (installation npm), ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée. Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Erreurs d’autorisation dans le bac à sable">
    Définissez `docker.user` sur un UID:GID correspondant au propriétaire de votre espace de travail monté, ou modifiez le propriétaire du dossier de l’espace de travail.
  </Accordion>

  <Accordion title="Outils personnalisés introuvables dans le bac à sable">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), qui charge `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` afin de placer en tête les chemins de vos outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="Processus arrêté pour mémoire insuffisante pendant la construction de l’image (code de sortie 137)">
    La VM nécessite au moins 2 Go de RAM. Utilisez une classe de machine supérieure et réessayez.
  </Accordion>

  <Accordion title="Non autorisé ou appairage requis dans l’interface de contrôle">
    Récupérez un nouveau lien vers le tableau de bord et approuvez l’appareil du navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Tableau de bord](/fr/web/dashboard), [Appareils](/fr/cli/devices).

  </Accordion>

  <Accordion title="La cible du Gateway affiche ws://172.x.x.x ou la CLI Docker rencontre des erreurs d’appairage">
    Réinitialisez le mode et l’adresse d’écoute du Gateway :

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Contenu associé

- [Présentation de l’installation](/fr/install) — toutes les méthodes d’installation
- [Podman](/fr/install/podman) — alternative à Docker avec Podman
- [ClawDock](/fr/install/clawdock) — configuration communautaire de Docker Compose
- [Mise à jour](/fr/install/updating) — maintenir OpenClaw à jour
- [Configuration](/fr/gateway/configuration) — configuration du Gateway après l’installation
