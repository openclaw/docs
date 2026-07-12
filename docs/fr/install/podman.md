---
read_when:
    - Vous souhaitez un Gateway conteneurisé avec Podman plutôt que Docker
summary: Exécuter OpenClaw dans un conteneur Podman sans privilèges root
title: Podman
x-i18n:
    generated_at: "2026-07-12T15:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Exécutez le Gateway OpenClaw dans un conteneur Podman sans privilèges root, géré par votre utilisateur non-root actuel.

Le modèle :

- Podman exécute le conteneur du Gateway.
- Votre CLI `openclaw` sur l’hôte sert de plan de contrôle.
- Par défaut, l’état persistant réside sur l’hôte sous `~/.openclaw`.
- La gestion quotidienne utilise `openclaw --container <name> ...` au lieu de `sudo -u openclaw`, `podman exec` ou d’un utilisateur de service distinct.

## Prérequis

- **Podman** en mode sans privilèges root
- **CLI OpenClaw** installée sur l’hôte
- **Facultatif :** `systemd --user` si vous souhaitez un démarrage automatique géré par Quadlet
- **Facultatif :** `sudo` uniquement si vous souhaitez utiliser `loginctl enable-linger "$(whoami)"` pour assurer la persistance au démarrage sur un hôte sans interface graphique

## Démarrage rapide

<Steps>
  <Step title="Configuration initiale">
    Depuis la racine du dépôt, exécutez `./scripts/podman/setup.sh`.

    Cette commande construit `openclaw:local` dans votre stockage Podman sans privilèges root (ou récupère `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si cette variable est définie), crée `~/.openclaw/openclaw.json` avec `gateway.mode: "local"` s’il est absent et crée `~/.openclaw/.env` avec un `OPENCLAW_GATEWAY_TOKEN` généré s’il est absent.

    Variables d’environnement facultatives utilisées lors de la construction :

    | Variable | Effet |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Utiliser une image existante ou récupérée au lieu de construire `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Installer des paquets apt supplémentaires pendant la construction de l’image (accepte également l’ancienne variable `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Installer des paquets Python supplémentaires pendant la construction de l’image ; épinglez les versions et utilisez uniquement des index de paquets auxquels vous faites confiance |
    | `OPENCLAW_EXTENSIONS` | Compiler/empaqueter les plugins pris en charge sélectionnés et installer leurs dépendances d’exécution |
    | `OPENCLAW_INSTALL_BROWSER` | Préinstaller Chromium et Xvfb pour l’automatisation du navigateur (définissez cette variable sur `1`) |

    Pour utiliser plutôt une configuration gérée par Quadlet (Linux et services utilisateur systemd uniquement) :

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Vous pouvez aussi définir `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Démarrer le conteneur du Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Démarre le conteneur avec vos uid/gid actuels à l’aide de `--userns=keep-id` et monte par liaison l’état OpenClaw de l’hôte dans le conteneur.

  </Step>

  <Step title="Exécuter la configuration initiale dans le conteneur">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Ouvrez ensuite `http://127.0.0.1:18789/` et utilisez le jeton provenant de `~/.openclaw/.env`.

    Authentification du modèle : utilisez l’authentification gérée par OpenClaw pendant la configuration (clés d’API Anthropic ou authentification OAuth par navigateur/par code d’appareil OpenAI Codex pour OpenAI reposant sur Codex). Le lanceur Podman ne monte pas dans le conteneur de configuration ou du Gateway les répertoires d’identifiants des CLI de l’hôte, tels que `~/.claude` ou `~/.codex`. Les connexions existantes aux CLI de l’hôte ne sont que des solutions pratiques sur un même hôte -- pour les installations en conteneur, conservez l’authentification du fournisseur dans l’état `~/.openclaw` monté que la configuration gère.

  </Step>

  <Step title="Gérer le conteneur en cours d’exécution depuis la CLI de l’hôte">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Les commandes `openclaw` ordinaires s’exécutent ensuite automatiquement dans ce conteneur :

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # inclut une analyse supplémentaire des services
    openclaw doctor
    openclaw channels login
    ```

    Sous macOS, la machine Podman peut donner au Gateway l’impression que le navigateur n’est pas local. Si l’interface de contrôle signale des erreurs d’authentification de l’appareil après le lancement, suivez les recommandations concernant Tailscale dans [Podman et Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Le lanceur manuel ne lit qu’une petite liste autorisée de clés liées à Podman dans `~/.openclaw/.env` et transmet explicitement les variables d’environnement d’exécution au conteneur ; il ne transmet pas l’intégralité du fichier d’environnement à Podman.

<a id="podman-and-tailscale"></a>

## Podman et Tailscale

Pour l’accès HTTPS ou l’accès distant depuis un navigateur, suivez la documentation principale de Tailscale.

Remarques propres à Podman :

- Conservez l’hôte de publication Podman sur `127.0.0.1`.
- Préférez un `tailscale serve` géré par l’hôte à `openclaw gateway --tailscale serve`.
- Sous macOS, si le contexte local d’authentification de l’appareil dans le navigateur n’est pas fiable, utilisez l’accès Tailscale plutôt que des solutions de contournement reposant sur des tunnels locaux improvisés.

Consultez [Tailscale](/fr/gateway/tailscale) et [Interface de contrôle](/fr/web/control-ui).

## Systemd (Quadlet, facultatif)

Si vous avez exécuté `./scripts/podman/setup.sh --quadlet`, la configuration installe un fichier Quadlet dans `~/.config/containers/systemd/openclaw.container`.

| Action | Commande                                   |
| ------ | ------------------------------------------ |
| Démarrer | `systemctl --user start openclaw.service`  |
| Arrêter | `systemctl --user stop openclaw.service`   |
| État | `systemctl --user status openclaw.service` |
| Journaux | `journalctl --user -u openclaw.service -f` |

Après avoir modifié le fichier Quadlet :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Pour assurer la persistance au démarrage sur les hôtes accessibles par SSH ou sans interface graphique, activez la persistance de session pour votre utilisateur actuel :

```bash
sudo loginctl enable-linger "$(whoami)"
```

Le service Quadlet généré conserve une configuration par défaut fixe et renforcée : ports publiés sur `127.0.0.1` (`18789` pour le Gateway, `18790` pour le pont), `--bind lan` dans le conteneur, espace de noms utilisateur `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` et `TimeoutStartSec=300`. Il lit `~/.openclaw/.env` comme `EnvironmentFile` d’exécution pour des valeurs telles que `OPENCLAW_GATEWAY_TOKEN`, mais n’utilise pas la liste autorisée de substitutions propres à Podman du lanceur manuel. Pour personnaliser les ports publiés, l’hôte de publication ou d’autres options d’exécution du conteneur, utilisez plutôt le lanceur manuel ou modifiez directement `~/.config/containers/systemd/openclaw.container`, puis rechargez et redémarrez le service.

## Configuration, environnement et stockage

- **Répertoire de configuration :** `~/.openclaw`
- **Répertoire de l’espace de travail :** `~/.openclaw/workspace`
- **Fichier du jeton :** `~/.openclaw/.env`
- **Assistant de lancement :** `./scripts/run-openclaw-podman.sh`

Le script de lancement et Quadlet montent par liaison l’état de l’hôte dans le conteneur : `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Par défaut, il s’agit de répertoires de l’hôte et non d’un état anonyme du conteneur ; ainsi, `openclaw.json`, les fichiers `auth-profiles.json` propres à chaque agent, l’état des canaux/fournisseurs, les sessions et l’espace de travail survivent au remplacement du conteneur. La configuration initialise également `gateway.controlUi.allowedOrigins` pour `127.0.0.1` et `localhost` sur le port publié du Gateway afin que le tableau de bord local fonctionne avec l’écoute non limitée à l’interface de bouclage du conteneur.

Variables d’environnement utiles pour le lanceur manuel (conservez-les dans `~/.openclaw/.env` ; le lanceur lit ce fichier avant de déterminer les valeurs par défaut définitives du conteneur et de l’image) :

| Variable                                   | Valeur par défaut | Effet                                  |
| ------------------------------------------ | ----------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`        | Nom du conteneur                       |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`  | Image à exécuter                       |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`           | Port de l’hôte mappé sur le port `18789` du conteneur |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`           | Port de l’hôte mappé sur le port `18790` du conteneur |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`       | Interface de l’hôte pour les ports publiés |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`             | Mode d’écoute du Gateway dans le conteneur |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`         | `keep-id`, `auto` ou `host`            |

Si vous utilisez une valeur non définie par défaut pour `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR`, définissez les mêmes variables pour `./scripts/podman/setup.sh` et les commandes `./scripts/run-openclaw-podman.sh launch` ultérieures -- le lanceur local au dépôt ne conserve pas les remplacements de chemins personnalisés d’un shell à l’autre.

## Mise à niveau des images

Après avoir reconstruit ou récupéré une nouvelle image, redémarrez le conteneur ou le service Quadlet.
Lors du premier démarrage d’une nouvelle version d’OpenClaw, le Gateway effectue des
réparations sûres de l’état et des plugins avant d’indiquer qu’il est prêt.

Si le Gateway s’arrête au lieu de devenir prêt, exécutez une fois la même image avec
`openclaw doctor --fix` sur les mêmes état et configuration montés, puis redémarrez
normalement le Gateway :

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Sur les hôtes SELinux, ajoutez `,Z` aux deux montages par liaison si Podman bloque l’accès à
l’état monté.

## Commandes utiles

- **Journaux du conteneur :** `podman logs -f openclaw`
- **Arrêter le conteneur :** `podman stop openclaw`
- **Supprimer le conteneur :** `podman rm -f openclaw`
- **Ouvrir l’URL du tableau de bord depuis la CLI de l’hôte :** `openclaw dashboard --no-open`
- **Santé/état via la CLI de l’hôte :** `openclaw gateway status --deep` (sonde RPC + analyse supplémentaire des services)

## Résolution des problèmes

- **Accès refusé (EACCES) à la configuration ou à l’espace de travail :** Le conteneur s’exécute par défaut avec `--userns=keep-id` et `--user <your uid>:<your gid>`. Vérifiez que les chemins de configuration et d’espace de travail de l’hôte appartiennent à votre utilisateur actuel.
- **Démarrage du Gateway bloqué (`gateway.mode=local` manquant) :** Vérifiez que `~/.openclaw/openclaw.json` existe et définit `gateway.mode="local"`. `scripts/podman/setup.sh` le crée s’il est absent.
- **Le conteneur redémarre après une mise à jour de l’image :** Exécutez la commande ponctuelle `openclaw doctor --fix` de la section [Mise à niveau des images](#upgrading-images), puis redémarrez le Gateway.
- **Les commandes de la CLI du conteneur ciblent la mauvaise instance :** Utilisez explicitement `openclaw --container <name> ...` ou exportez `OPENCLAW_CONTAINER=<name>` dans votre shell.
- **Échec de `openclaw update` avec `--container` :** Comportement attendu. Reconstruisez ou récupérez l’image, puis redémarrez le conteneur ou le service Quadlet.
- **Le service Quadlet ne démarre pas :** Exécutez `systemctl --user daemon-reload`, puis `systemctl --user start openclaw.service`. Sur les systèmes sans interface graphique, vous devrez peut-être également exécuter `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloque les montages par liaison :** Ne modifiez pas le comportement de montage par défaut ; le lanceur ajoute automatiquement `:Z` sous Linux lorsque SELinux est en mode enforcing ou permissif.

## Pages connexes

- [Docker](/fr/install/docker)
- [Processus d’arrière-plan du Gateway](/fr/gateway/background-process)
- [Résolution des problèmes du Gateway](/fr/gateway/troubleshooting)
