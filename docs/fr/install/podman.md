---
read_when:
    - Vous voulez un Gateway conteneurisé avec Podman au lieu de Docker
summary: Exécuter OpenClaw dans un conteneur Podman sans privilèges root
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Exécutez le Gateway OpenClaw dans un conteneur Podman sans root, géré par votre utilisateur non root actuel.

Le modèle prévu est le suivant :

- Podman exécute le conteneur du gateway.
- Votre CLI `openclaw` hôte sert de plan de contrôle.
- L’état persistant réside sur l’hôte sous `~/.openclaw` par défaut.
- La gestion quotidienne utilise `openclaw --container <name> ...` au lieu de `sudo -u openclaw`, `podman exec` ou un utilisateur de service séparé.

## Prérequis

- **Podman** en mode sans root
- **CLI OpenClaw** installée sur l’hôte
- **Facultatif :** `systemd --user` si vous voulez un démarrage automatique géré par Quadlet
- **Facultatif :** `sudo` uniquement si vous voulez `loginctl enable-linger "$(whoami)"` pour la persistance au démarrage sur un hôte sans écran

## Démarrage rapide

<Steps>
  <Step title="Configuration unique">
    Depuis la racine du dépôt, exécutez `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Démarrer le conteneur Gateway">
    Démarrez le conteneur avec `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Exécuter l’onboarding dans le conteneur">
    Exécutez `./scripts/run-openclaw-podman.sh launch setup`, puis ouvrez `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gérer le conteneur en cours d’exécution depuis la CLI hôte">
    Définissez `OPENCLAW_CONTAINER=openclaw`, puis utilisez les commandes `openclaw` normales depuis l’hôte.
  </Step>
</Steps>

Détails de configuration :

- `./scripts/podman/setup.sh` construit `openclaw:local` dans votre stockage Podman sans root par défaut, ou utilise `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si vous en définissez une.
- Il crée `~/.openclaw/openclaw.json` avec `gateway.mode: "local"` s’il est absent.
- Il crée `~/.openclaw/.env` avec `OPENCLAW_GATEWAY_TOKEN` s’il est absent.
- Pour les lancements manuels, l’assistant lit uniquement une petite liste d’autorisation de clés liées à Podman depuis `~/.openclaw/.env` et transmet des variables d’environnement d’exécution explicites au conteneur ; il ne transmet pas l’intégralité du fichier d’environnement à Podman.

Configuration gérée par Quadlet :

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet est une option réservée à Linux, car elle dépend des services utilisateur systemd.

Vous pouvez aussi définir `OPENCLAW_PODMAN_QUADLET=1`.

Variables d’environnement facultatives de construction/configuration :

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- utiliser une image existante/téléchargée au lieu de construire `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- installer des paquets apt supplémentaires pendant la construction de l’image (accepte aussi l’ancien `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- installer des paquets Python supplémentaires pendant la construction de l’image ; épinglez les versions et utilisez uniquement des index de paquets auxquels vous faites confiance
- `OPENCLAW_EXTENSIONS` -- préinstaller les dépendances de plugins au moment de la construction
- `OPENCLAW_INSTALL_BROWSER` -- préinstaller Chromium et Xvfb pour l’automatisation du navigateur (définir sur `1` pour activer)

Démarrage du conteneur :

```bash
./scripts/run-openclaw-podman.sh launch
```

Le script démarre le conteneur avec vos uid/gid actuels via `--userns=keep-id` et monte par liaison votre état OpenClaw dans le conteneur.

Onboarding :

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Puis ouvrez `http://127.0.0.1:18789/` et utilisez le jeton depuis `~/.openclaw/.env`.

Authentification de modèle dans Podman :

- Utilisez l’authentification gérée par OpenClaw pendant la configuration : clés API Anthropic pour Anthropic, ou authentification OAuth navigateur/code d’appareil OpenAI Codex pour OpenAI adossé à Codex.
- Le lanceur Podman ne monte pas les répertoires d’identifiants de CLI hôte comme `~/.claude` ou `~/.codex` dans le conteneur de configuration ou de gateway.
- Les connexions CLI hôte existantes sont des chemins pratiques sur le même hôte. Pour les installations en conteneur, conservez l’authentification fournisseur dans l’état monté `~/.openclaw` que la configuration gère.

Valeur par défaut de la CLI hôte :

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ensuite, des commandes comme celles-ci s’exécuteront automatiquement dans ce conteneur :

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Sur macOS, la machine Podman peut faire apparaître le navigateur comme non local pour le gateway.
Si la Control UI signale des erreurs d’authentification d’appareil après le lancement, utilisez les indications Tailscale dans
[Podman et Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman et Tailscale

Pour l’accès HTTPS ou l’accès à distance par navigateur, suivez la documentation Tailscale principale.

Note spécifique à Podman :

- Conservez l’hôte de publication Podman à `127.0.0.1`.
- Préférez `tailscale serve` géré par l’hôte à `openclaw gateway --tailscale serve`.
- Sur macOS, si le contexte d’authentification d’appareil du navigateur local n’est pas fiable, utilisez l’accès Tailscale au lieu de contournements ponctuels par tunnel local.

Voir :

- [Tailscale](/fr/gateway/tailscale)
- [Control UI](/fr/web/control-ui)

## Systemd (Quadlet, facultatif)

Si vous avez exécuté `./scripts/podman/setup.sh --quadlet`, la configuration installe un fichier Quadlet à l’emplacement :

```bash
~/.config/containers/systemd/openclaw.container
```

Commandes utiles :

- **Démarrer :** `systemctl --user start openclaw.service`
- **Arrêter :** `systemctl --user stop openclaw.service`
- **État :** `systemctl --user status openclaw.service`
- **Journaux :** `journalctl --user -u openclaw.service -f`

Après modification du fichier Quadlet :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Pour la persistance au démarrage sur les hôtes SSH/sans écran, activez le maintien de session pour votre utilisateur actuel :

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuration, environnement et stockage

- **Répertoire de configuration :** `~/.openclaw`
- **Répertoire de l’espace de travail :** `~/.openclaw/workspace`
- **Fichier de jeton :** `~/.openclaw/.env`
- **Assistant de lancement :** `./scripts/run-openclaw-podman.sh`

Le script de lancement et Quadlet montent par liaison l’état hôte dans le conteneur :

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Par défaut, il s’agit de répertoires hôte, et non d’un état de conteneur anonyme ; ainsi
`openclaw.json`, les fichiers `auth-profiles.json` par agent, l’état des canaux/fournisseurs,
les sessions et l’espace de travail survivent au remplacement du conteneur.
La configuration Podman initialise aussi `gateway.controlUi.allowedOrigins` pour `127.0.0.1` et `localhost` sur le port de gateway publié afin que le tableau de bord local fonctionne avec la liaison non-local loopback du conteneur.

Variables d’environnement utiles pour le lanceur manuel :

- `OPENCLAW_PODMAN_CONTAINER` -- nom du conteneur (`openclaw` par défaut)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image à exécuter
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hôte mappé au port conteneur `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hôte mappé au port conteneur `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface hôte pour les ports publiés ; la valeur par défaut est `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode de liaison du gateway dans le conteneur ; la valeur par défaut est `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (par défaut), `auto` ou `host`

Le lanceur manuel lit `~/.openclaw/.env` avant de finaliser les valeurs par défaut du conteneur/de l’image ; vous pouvez donc les y persister.

Si vous utilisez un `OPENCLAW_CONFIG_DIR` ou un `OPENCLAW_WORKSPACE_DIR` non par défaut, définissez les mêmes variables pour `./scripts/podman/setup.sh` et les commandes ultérieures `./scripts/run-openclaw-podman.sh launch`. Le lanceur local au dépôt ne persiste pas les substitutions de chemins personnalisés entre les shells.

Note Quadlet :

- Le service Quadlet généré conserve intentionnellement une forme par défaut fixe et renforcée : ports publiés sur `127.0.0.1`, `--bind lan` dans le conteneur, et espace de noms utilisateur `keep-id`.
- Il épingle `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` et `TimeoutStartSec=300`.
- Il publie à la fois `127.0.0.1:18789:18789` (gateway) et `127.0.0.1:18790:18790` (bridge).
- Il lit `~/.openclaw/.env` comme `EnvironmentFile` d’exécution pour des valeurs comme `OPENCLAW_GATEWAY_TOKEN`, mais il ne consomme pas la liste d’autorisation de substitutions spécifiques à Podman du lanceur manuel.
- Si vous avez besoin de ports de publication personnalisés, d’un hôte de publication personnalisé ou d’autres indicateurs d’exécution de conteneur, utilisez le lanceur manuel ou modifiez directement `~/.config/containers/systemd/openclaw.container`, puis rechargez et redémarrez le service.

## Commandes utiles

- **Journaux du conteneur :** `podman logs -f openclaw`
- **Arrêter le conteneur :** `podman stop openclaw`
- **Supprimer le conteneur :** `podman rm -f openclaw`
- **Ouvrir l’URL du tableau de bord depuis la CLI hôte :** `openclaw dashboard --no-open`
- **Santé/état via la CLI hôte :** `openclaw gateway status --deep` (sonde RPC + analyse de service
  supplémentaire)

## Dépannage

- **Permission refusée (EACCES) sur la configuration ou l’espace de travail :** Le conteneur s’exécute avec `--userns=keep-id` et `--user <your uid>:<your gid>` par défaut. Assurez-vous que les chemins de configuration/espace de travail hôte appartiennent à votre utilisateur actuel.
- **Démarrage du Gateway bloqué (`gateway.mode=local` manquant) :** Assurez-vous que `~/.openclaw/openclaw.json` existe et définit `gateway.mode="local"`. `scripts/podman/setup.sh` le crée s’il est absent.
- **Les commandes CLI de conteneur atteignent la mauvaise cible :** Utilisez explicitement `openclaw --container <name> ...`, ou exportez `OPENCLAW_CONTAINER=<name>` dans votre shell.
- **`openclaw update` échoue avec `--container` :** Comportement attendu. Reconstruisez/téléchargez l’image, puis redémarrez le conteneur ou le service Quadlet.
- **Le service Quadlet ne démarre pas :** Exécutez `systemctl --user daemon-reload`, puis `systemctl --user start openclaw.service`. Sur les systèmes sans écran, vous devrez peut-être aussi exécuter `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloque les montages par liaison :** Laissez le comportement de montage par défaut inchangé ; le lanceur ajoute automatiquement `:Z` sous Linux lorsque SELinux est en mode enforcing ou permissive.

## Connexe

- [Docker](/fr/install/docker)
- [Processus d’arrière-plan Gateway](/fr/gateway/background-process)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
