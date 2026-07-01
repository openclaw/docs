---
read_when:
    - Vous voulez un gateway conteneurisé plutôt que des installations locales
    - Vous validez le flux Docker
summary: Configuration et intégration facultatives basées sur Docker pour OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:58:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker est **facultatif**. Utilisez-le uniquement si vous voulez un Gateway conteneurisé ou valider le flux Docker.

## Docker me convient-il ?

- **Oui** : vous voulez un environnement de Gateway isolé et jetable, ou exécuter OpenClaw sur un hôte sans installations locales.
- **Non** : vous exécutez OpenClaw sur votre propre machine et voulez simplement la boucle de développement la plus rapide. Utilisez plutôt le flux d’installation normal.
- **Note sur le bac à sable** : le backend de bac à sable par défaut utilise Docker quand le bac à sable est activé, mais le bac à sable est désactivé par défaut et ne nécessite **pas** que le Gateway complet s’exécute dans Docker. Les backends de bac à sable SSH et OpenShell sont également disponibles. Voir [Bac à sable](/fr/gateway/sandboxing).

## Prérequis

- Docker Desktop (ou Docker Engine) + Docker Compose v2
- Au moins 2 Go de RAM pour la construction de l’image (`pnpm install` peut être tué par manque de mémoire sur des hôtes de 1 Go avec le code de sortie 137)
- Suffisamment d’espace disque pour les images et les journaux
- En cas d’exécution sur un VPS/hôte public, consultez
  [Durcissement de la sécurité pour l’exposition réseau](/fr/gateway/security),
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

    Les images préconstruites sont d’abord publiées dans le
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR est le registre principal pour l’automatisation des versions, les déploiements épinglés
    et les contrôles de provenance. Le même flux de publication publie aussi un miroir officiel
    Docker Hub à `openclaw/openclaw` pour les hôtes qui préfèrent Docker Hub :

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Utilisez `ghcr.io/openclaw/openclaw` ou `openclaw/openclaw`. Évitez les miroirs
    Docker Hub communautaires, car OpenClaw ne contrôle pas leur calendrier de publication,
    leurs reconstructions ni leur politique de rétention. Étiquettes officielles courantes : `main`, `latest`,
    `<version>` (par exemple `2026.2.26`) et les versions bêta comme
    `2026.2.26-beta.1`. Les étiquettes bêta ne déplacent pas `latest` ni `main`.

  </Step>

  <Step title="Réexécution hors ligne">
    Sur les hôtes hors ligne, transférez et chargez d’abord l’image :

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` vérifie que `OPENCLAW_IMAGE` existe déjà localement, désactive
    les extractions et constructions Compose implicites, puis exécute le flux de configuration normal, comme
    la synchronisation de `.env`, les corrections d’autorisations, l’intégration, la synchronisation de configuration du Gateway
    et le démarrage Compose.

    Si `OPENCLAW_SANDBOX=1`, la configuration hors ligne vérifie également les images de bac à sable par défaut configurées
    et actives par agent sur le démon derrière
    `OPENCLAW_DOCKER_SOCKET`. Les images de navigateur adossées à Docker doivent également porter l’étiquette
    de contrat de navigateur OpenClaw actuelle. Quand une image requise est absente ou
    incompatible, la configuration se termine sans modifier la configuration du bac à sable au lieu de
    signaler une réussite avec un bac à sable inutilisable.

  </Step>

  <Step title="Terminer l’intégration">
    Le script de configuration exécute automatiquement l’intégration. Il va :

    - demander les clés d’API du fournisseur
    - générer un jeton de Gateway et l’écrire dans `.env`
    - créer le répertoire de clé secrète du profil d’authentification
    - démarrer le Gateway via Docker Compose

    Pendant la configuration, l’intégration avant démarrage et les écritures de configuration passent directement par
    `openclaw-gateway`. `openclaw-cli` sert aux commandes que vous exécutez après
    que le conteneur du Gateway existe déjà.

  </Step>

  <Step title="Ouvrir l’interface de contrôle">
    Ouvrez `http://127.0.0.1:18789/` dans votre navigateur et collez le secret partagé
    configuré dans les paramètres. Le script de configuration écrit par défaut un jeton dans `.env` ;
    si vous basculez la configuration du conteneur vers l’authentification par mot de passe, utilisez plutôt ce
    mot de passe.

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
incluez-le après tout fichier de surcharge standard, par exemple
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quand les deux fichiers de surcharge existent.
</Note>

<Note>
Comme `openclaw-cli` partage l’espace de noms réseau de `openclaw-gateway`, c’est un
outil post-démarrage. Avant `docker compose up -d openclaw-gateway`, exécutez l’intégration
et les écritures de configuration de configuration initiale via `openclaw-gateway` avec
`--no-deps --entrypoint node`.
</Note>

### Variables d’environnement

Le script de configuration accepte ces variables d’environnement facultatives :

| Variable                                        | Objectif                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Utiliser une image distante au lieu de construire localement          |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Installer des paquets apt supplémentaires pendant la construction (séparés par des espaces) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Installer des paquets Python supplémentaires pendant la construction (séparés par des espaces) |
| `OPENCLAW_EXTENSIONS`                           | Préinstaller les dépendances de plugins au moment de la construction (noms séparés par des espaces) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Remplacer les options Node de construction locale depuis les sources  |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Remplacer le tas tsdown de construction locale depuis les sources en Mo |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Ignorer la sortie de déclarations pendant les constructions d’images locales uniquement runtime |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montages bind hôte supplémentaires (`source:target[:opts]` séparés par des virgules) |
| `OPENCLAW_HOME_VOLUME`                          | Conserver `/home/node` dans un volume Docker nommé                    |
| `OPENCLAW_SANDBOX`                              | Activer l’amorçage du bac à sable (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                      | Ignorer l’étape d’intégration interactive (`1`, `true`, `yes`, `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                        | Remplacer le chemin du socket Docker                                  |
| `OPENCLAW_DISABLE_BONJOUR`                      | Désactiver l’annonce Bonjour/mDNS (valeur par défaut `1` pour Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Désactiver les surcouches de montage bind des sources de plugins groupés |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Point de terminaison du collecteur OTLP/HTTP partagé pour l’export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Points de terminaison OTLP propres au signal pour les traces, les métriques ou les journaux |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Remplacement du protocole OTLP. Seul `http/protobuf` est pris en charge aujourd’hui |
| `OTEL_SERVICE_NAME`                             | Nom de service utilisé pour les ressources OpenTelemetry              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Activer les derniers attributs sémantiques GenAI expérimentaux        |
| `OPENCLAW_OTEL_PRELOADED`                       | Ignorer le démarrage d’un second SDK OpenTelemetry lorsqu’un est préchargé |

L’image Docker officielle n’inclut pas Homebrew. Pendant l’intégration, OpenClaw
masque les installateurs de dépendances de Skills réservés à brew quand il s’exécute dans un conteneur
Linux sans `brew` ; ces dépendances doivent être fournies par une image personnalisée
ou installées manuellement. Pour les dépendances disponibles sous forme de paquets Debian, utilisez
`OPENCLAW_IMAGE_APT_PACKAGES` pendant la construction de l’image. L’ancien nom
`OPENCLAW_DOCKER_APT_PACKAGES` est toujours accepté.
Pour les dépendances Python, utilisez `OPENCLAW_IMAGE_PIP_PACKAGES`. Cela exécute
`python3 -m pip install --break-system-packages` pendant la construction de l’image ; épinglez donc
les versions des paquets et utilisez uniquement des index de paquets auxquels vous faites confiance.
Les constructions depuis les sources définissent par défaut `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` sur
`--max-old-space-size=8192` et laissent
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` non défini afin que le wrapper tsdown puisse
respecter les limites de mémoire du conteneur. Elles définissent aussi par défaut
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1`, car les images runtime suppriment les fichiers de
déclaration après la construction. Si Docker signale `ResourceExhausted`, `cannot allocate
memory` ou abandonne pendant `tsdown`, augmentez la limite de mémoire du builder Docker ou
réessayez avec des tailles de tas explicites plus petites, par exemple
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Les mainteneurs peuvent tester les sources de plugins groupés avec une image empaquetée en montant
un répertoire source de Plugin sur son chemin de source empaqueté, par exemple
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Ce répertoire source monté remplace le paquet compilé correspondant
`/app/dist/extensions/synology-chat` pour le même identifiant de Plugin.

### Observabilité

L’export OpenTelemetry est sortant depuis le conteneur Gateway vers votre collecteur
OTLP. Il ne nécessite pas de port Docker publié. Si vous construisez l’image
localement et voulez que l’exporteur OpenTelemetry groupé soit disponible dans l’image,
incluez ses dépendances runtime :

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installez le Plugin officiel `@openclaw/diagnostics-otel` depuis ClawHub dans
les installations Docker empaquetées avant d’activer l’export. Les images personnalisées construites depuis les sources peuvent
toujours inclure la source locale du Plugin avec
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Pour activer l’export, autorisez et activez le
Plugin `diagnostics-otel` dans la configuration, puis définissez
`diagnostics.otel.enabled=true` ou utilisez l’exemple de configuration dans [Export
OpenTelemetry](/fr/gateway/opentelemetry). Les en-têtes d’authentification du collecteur sont configurés via
`diagnostics.otel.headers`, et non via des variables d’environnement Docker.

Les métriques Prometheus utilisent le port Gateway déjà publié. Installez
`clawhub:@openclaw/diagnostics-prometheus`, activez le Plugin
`diagnostics-prometheus`, puis collectez :

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route est protégée par l’authentification du Gateway. N’exposez pas de port
public `/metrics` séparé ni de chemin de proxy inverse non authentifié. Voir
[Métriques Prometheus](/fr/gateway/prometheus).

### Contrôles de santé

Points de terminaison de sonde du conteneur (aucune authentification requise) :

```bash
curl -fsS http://127.0.0.1:18789/healthz   # vivacité
curl -fsS http://127.0.0.1:18789/readyz     # disponibilité
```

L’image Docker inclut un `HEALTHCHECK` intégré qui interroge `/healthz`.
Si les vérifications continuent d’échouer, Docker marque le conteneur comme `unhealthy` et
les systèmes d’orchestration peuvent le redémarrer ou le remplacer.

Instantané de santé approfondi authentifié :

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ou loopback

`scripts/docker/setup.sh` définit par défaut `OPENCLAW_GATEWAY_BIND=lan` afin que l’accès depuis l’hôte à
`http://127.0.0.1:18789` fonctionne avec la publication de port Docker.

- `lan` (par défaut) : le navigateur de l’hôte et la CLI de l’hôte peuvent atteindre le port publié du gateway.
- `loopback` : seuls les processus à l’intérieur de l’espace de noms réseau du conteneur peuvent atteindre
  directement le gateway.

<Note>
Utilisez les valeurs de mode de liaison dans `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), et non des alias d’hôte comme `0.0.0.0` ou `127.0.0.1`.
</Note>

### Fournisseurs locaux de l’hôte

Quand OpenClaw s’exécute dans Docker, `127.0.0.1` à l’intérieur du conteneur désigne le conteneur
lui-même, pas votre machine hôte. Utilisez `host.docker.internal` pour les fournisseurs d’IA qui
s’exécutent sur l’hôte :

| Fournisseur | URL par défaut de l’hôte | URL de configuration Docker         |
| ----------- | ------------------------ | ----------------------------------- |
| LM Studio   | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama      | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configuration Docker fournie utilise ces URL d’hôte comme valeurs par défaut d’onboarding
pour LM Studio et Ollama, et `docker-compose.yml` associe `host.docker.internal` au
gateway hôte de Docker pour Docker Engine sous Linux. Docker Desktop fournit déjà
le même nom d’hôte sous macOS et Windows.

Les services de l’hôte doivent aussi écouter sur une adresse joignable depuis Docker :

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si vous utilisez votre propre fichier Compose ou commande `docker run`, ajoutez vous-même
le même mappage d’hôte, par exemple
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI dans Docker

L’image Docker officielle d’OpenClaw ne préinstalle pas Claude Code. Installez et
connectez-vous à Claude Code dans l’utilisateur du conteneur qui exécute OpenClaw, puis persistez
ce répertoire personnel de conteneur afin que les mises à niveau de l’image n’effacent pas le binaire ni l’état
d’authentification Claude.

Pour les nouvelles installations Docker, activez un volume `/home/node` persistant avant d’exécuter
la configuration :

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Pour une installation Docker existante, arrêtez d’abord la pile et rechargez les valeurs Docker
`.env` actuelles avant de relancer la configuration. Le script de configuration ne lit pas
`.env` tout seul ; il réécrit `.env` à partir du shell courant et des valeurs par défaut. Pour
le fichier `.env` généré, exécutez :

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Si votre `.env` contient des valeurs que votre shell ne peut pas sourcer, réexportez manuellement
les valeurs existantes dont vous dépendez d’abord, comme `OPENCLAW_IMAGE`, les ports, le mode de liaison,
les chemins personnalisés, `OPENCLAW_EXTRA_MOUNTS`, le bac à sable et les paramètres de saut d’onboarding.
La surcouche générée monte le volume du répertoire personnel pour `openclaw-gateway` et
`openclaw-cli`.

Exécutez les commandes restantes avec la surcouche Compose générée afin que les deux services
montent le répertoire personnel persisté. Si votre configuration utilise aussi `docker-compose.override.yml`,
incluez-le avant `docker-compose.extra.yml`.

Installez Claude Code dans ce répertoire personnel persisté :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

L’installateur natif écrit le binaire `claude` sous
`/home/node/.local/bin/claude`. Indiquez à OpenClaw d’utiliser ce chemin de conteneur :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Connectez-vous et vérifiez depuis le même répertoire personnel de conteneur persisté :

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

Après cela, vous pouvez utiliser le backend `claude-cli` fourni :

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` persiste l’installation native de Claude Code sous
`/home/node/.local/bin` et `/home/node/.local/share/claude`, ainsi que les
paramètres et l’état d’authentification Claude Code sous `/home/node/.claude` et `/home/node/.claude.json`.
Persister seulement `/home/node/.openclaw` ne suffit pas pour réutiliser Claude CLI. Si
vous utilisez `OPENCLAW_EXTRA_MOUNTS` au lieu d’un volume de répertoire personnel, montez tous ces
chemins Claude dans les deux services Docker.

<Note>
Pour l’automatisation de production partagée ou une facturation Anthropic prévisible, préférez le
chemin par clé d’API Anthropic. La réutilisation de Claude CLI suit la version installée,
la connexion au compte, la facturation et le comportement de mise à jour de Claude Code.
</Note>

### Bonjour / mDNS

Le réseau bridge Docker ne transfère généralement pas le multicast Bonjour/mDNS
(`224.0.0.251:5353`) de manière fiable. La configuration Compose fournie définit donc par défaut
`OPENCLAW_DISABLE_BONJOUR=1` afin que le Gateway n’entre pas dans une boucle de plantage ou ne
redémarre pas à répétition la publicité lorsque le bridge abandonne le trafic multicast.

Utilisez l’URL publiée du Gateway, Tailscale ou DNS-SD étendu pour les hôtes Docker.
Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement lors de l’exécution avec le réseau de l’hôte, macvlan,
ou un autre réseau où le multicast mDNS est connu pour fonctionner.

Pour les pièges et le dépannage, consultez [découverte Bonjour](/fr/gateway/bonjour).

### Stockage et persistance

Docker Compose monte en bind `OPENCLAW_CONFIG_DIR` sur `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` sur `/home/node/.openclaw/workspace`, et
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` sur `/home/node/.config/openclaw`, afin que ces
chemins survivent au remplacement du conteneur. Quand une variable n’est pas définie, le
`docker-compose.yml` fourni se rabat sous `${HOME}`, ou `/tmp` lorsque `HOME` lui-même est
également absent. Cela évite que `docker compose up` émette une spécification de volume
à source vide dans les environnements nus.

Ce répertoire de configuration monté est l’endroit où OpenClaw conserve :

- `openclaw.json` pour la configuration du comportement
- `agents/<agentId>/agent/auth-profiles.json` pour l’authentification OAuth/clé d’API fournisseur stockée
- `.env` pour les secrets d’exécution basés sur l’environnement comme `OPENCLAW_GATEWAY_TOKEN`

Le répertoire de clé secrète des profils d’authentification stocke la clé de chiffrement locale utilisée pour
les données de jetons de profils d’authentification basés sur OAuth. Conservez-le avec l’état de votre hôte Docker,
mais séparément de `OPENCLAW_CONFIG_DIR`.

Les Plugins téléchargeables installés stockent leur état de paquet sous le répertoire personnel OpenClaw monté,
afin que les enregistrements d’installation de plugins et les racines de paquets survivent au remplacement du conteneur.
Le démarrage du Gateway ne génère pas d’arborescences de dépendances de plugins fournis.

Pour les détails complets de persistance sur les déploiements de VM, consultez
[Runtime VM Docker - ce qui persiste où](/fr/install/docker-vm-runtime#what-persists-where).

**Points chauds de croissance disque :** surveillez `media/`, les fichiers JSONL de session, la base de données
d’état SQLite partagée, les racines de paquets de plugins installés et les journaux de fichiers tournants
sous `/tmp/openclaw/`.

### Assistants shell (facultatif)

Pour faciliter la gestion quotidienne de Docker, installez `ClawDock` :

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si vous avez installé ClawDock depuis l’ancien chemin brut `scripts/shell-helpers/clawdock-helpers.sh`, relancez la commande d’installation ci-dessus afin que votre fichier d’assistant local suive le nouvel emplacement.

Utilisez ensuite `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, etc. Exécutez
`clawdock-help` pour toutes les commandes.
Consultez [ClawDock](/fr/install/clawdock) pour le guide complet des assistants.

<AccordionGroup>
  <Accordion title="Activer le bac à sable de l’agent pour le gateway Docker">
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

    Le script monte `docker.sock` seulement après la réussite des prérequis du bac à sable. Si
    la configuration du bac à sable ne peut pas se terminer, le script réinitialise `agents.defaults.sandbox.mode`
    à `off`. Les tours en mode code de Codex restent limités à Codex
    `workspace-write` pendant que le bac à sable OpenClaw est actif ; ne montez pas le
    socket Docker de l’hôte dans les conteneurs de bac à sable d’agent.

  </Accordion>

  <Accordion title="Automatisation / CI (non interactif)">
    Désactivez l’allocation de pseudo-TTY Compose avec `-T` :

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Note de sécurité sur le réseau partagé">
    `openclaw-cli` utilise `network_mode: "service:openclaw-gateway"` afin que les commandes CLI
    puissent atteindre le gateway via `127.0.0.1`. Traitez cela comme une frontière de confiance
    partagée. La configuration compose supprime `NET_RAW`/`NET_ADMIN` et active
    `no-new-privileges` sur `openclaw-gateway` et `openclaw-cli`.
  </Accordion>

  <Accordion title="Échecs DNS de Docker Desktop dans openclaw-cli">
    Certaines configurations Docker Desktop échouent à résoudre DNS depuis le sidecar
    `openclaw-cli` en réseau partagé après la suppression de `NET_RAW`, ce qui apparaît sous forme de
    `EAI_AGAIN` pendant les commandes adossées à npm comme `openclaw plugins install`.
    Conservez le fichier compose renforcé par défaut pour le fonctionnement normal du gateway. La
    surcharge locale ci-dessous assouplit la posture de sécurité du conteneur CLI en
    restaurant les capacités par défaut de Docker ; utilisez-la donc seulement pour la commande CLI ponctuelle
    qui nécessite l’accès au registre de paquets, et non comme invocation Compose par défaut :

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Si vous avez déjà créé un conteneur `openclaw-cli` de longue durée, recréez-le
    avec la même surcharge. `docker compose exec` et `docker exec` ne peuvent pas
    modifier les capacités Linux sur un conteneur déjà créé.

  </Accordion>

  <Accordion title="Autorisations et EACCES">
    L’image s’exécute en tant que `node` (uid 1000). Si vous voyez des erreurs d’autorisation sur
    `/home/node/.openclaw`, assurez-vous que vos montages bind de l’hôte appartiennent à l’uid 1000 :

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Le même décalage peut apparaître sous forme d’avertissement de plugin tel que
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    suivi de `plugin present but blocked`. Cela signifie que l’uid du processus et le
    propriétaire du répertoire de plugin monté ne correspondent pas. Préférez exécuter le conteneur avec l’uid
    1000 par défaut et corriger la propriété du montage bind. N’exécutez `chown`
    `/path/to/openclaw-config/npm` vers `root:root` que si vous exécutez intentionnellement
    OpenClaw en tant que root à long terme.

  </Accordion>

  <Accordion title="Reconstructions plus rapides">
    Ordonnez votre Dockerfile afin que les couches de dépendances soient mises en cache. Cela évite de relancer
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

  <Accordion title="Power-user container options">
    L’image par défaut privilégie la sécurité et s’exécute en tant que `node` non root. Pour un conteneur
    plus complet :

    1. **Persister `/home/node`** : `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Intégrer les dépendances système** : `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Intégrer les dépendances Python** : `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Intégrer Playwright Chromium** : `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Ou installer les navigateurs Playwright dans un volume persistant** :
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Persister les téléchargements de navigateurs** : utilisez `OPENCLAW_HOME_VOLUME` ou
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw détecte automatiquement le Chromium géré par Playwright de l’image Docker
       sous Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Si vous choisissez OpenAI Codex OAuth dans l’assistant, celui-ci ouvre une URL de navigateur. Dans
    Docker ou les configurations sans interface graphique, copiez l’URL de redirection complète sur laquelle vous arrivez et collez-la
    dans l’assistant pour terminer l’authentification.
  </Accordion>

  <Accordion title="Base image metadata">
    L’image d’exécution Docker principale utilise `node:24-bookworm-slim` et inclut `tini` comme processus d’initialisation du point d’entrée (PID 1) afin de garantir que les processus zombies sont récupérés et que les signaux sont correctement gérés dans les conteneurs de longue durée. Elle publie des annotations d’image de base OCI, notamment `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` et d’autres. Le condensat de base Node est
    actualisé via les PR Dependabot d’image de base Docker ; les builds de publication n’exécutent pas
    de couche de mise à niveau de distribution. Consultez
    [Annotations d’image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Exécution sur un VPS ?

Consultez [Hetzner (VPS Docker)](/fr/install/hetzner) et
[Exécution Docker VM](/fr/install/docker-vm-runtime) pour les étapes de déploiement sur VM partagée,
notamment l’intégration de binaires, la persistance et les mises à jour.

## Bac à sable de l’agent

Lorsque `agents.defaults.sandbox` est activé avec le backend Docker, le Gateway
exécute les outils de l’agent (shell, lecture/écriture de fichiers, etc.) dans des conteneurs Docker
isolés, tandis que le Gateway lui-même reste sur l’hôte. Cela vous donne une séparation stricte
autour des sessions d’agents non fiables ou multi-locataires sans conteneuriser l’ensemble du
Gateway.

La portée du bac à sable peut être par agent (par défaut), par session ou partagée. Chaque portée
obtient son propre espace de travail monté sur `/workspace`. Vous pouvez également configurer
des politiques d’autorisation/refus d’outils, l’isolation réseau, des limites de ressources et des conteneurs
de navigateur.

Pour la configuration complète, les images, les notes de sécurité et les profils multi-agents, consultez :

- [Bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable
- [OpenShell](/fr/gateway/openshell) -- accès shell interactif aux conteneurs du bac à sable
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

Pour les installations npm sans checkout source, consultez [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) pour les commandes `docker build` en ligne.

## Dépannage

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Construisez l’image de bac à sable avec
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout source) ou la commande `docker build` en ligne depuis [Bac à sable § Images et configuration](/fr/gateway/sandboxing#images-and-setup) (installation npm),
    ou définissez `agents.defaults.sandbox.docker.image` sur votre image personnalisée.
    Les conteneurs sont créés automatiquement par session à la demande.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Définissez `docker.user` sur un UID:GID qui correspond au propriétaire de votre espace de travail monté,
    ou modifiez le propriétaire du dossier de l’espace de travail.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw exécute les commandes avec `sh -lc` (shell de connexion), qui source
    `/etc/profile` et peut réinitialiser PATH. Définissez `docker.env.PATH` pour préfixer vos
    chemins d’outils personnalisés, ou ajoutez un script sous `/etc/profile.d/` dans votre Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    La VM nécessite au moins 2 Go de RAM. Utilisez une classe de machine plus grande et réessayez.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Récupérez un nouveau lien de tableau de bord et approuvez l’appareil du navigateur :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Plus de détails : [Tableau de bord](/fr/web/dashboard), [Appareils](/fr/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
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
