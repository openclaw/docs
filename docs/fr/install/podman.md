---
read_when:
    - Vous voulez une Gateway conteneurisée avec Podman au lieu de Docker
summary: Exécuter OpenClaw dans un conteneur Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-23T07:05:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Exécutez la Gateway OpenClaw dans un conteneur Podman rootless, géré par votre utilisateur non root actuel.

Le modèle prévu est le suivant :

- Podman exécute le conteneur Gateway.
- Votre CLI `openclaw` hôte est le plan de contrôle.
- L’état persistant vit sur l’hôte sous `~/.openclaw` par défaut.
- La gestion quotidienne utilise `openclaw --container <name> ...` au lieu de `sudo -u openclaw`, `podman exec` ou d’un utilisateur de service distinct.

## Prérequis

- **Podman** en mode rootless
- **OpenClaw CLI** installée sur l’hôte
- **Optionnel :** `systemd --user` si vous voulez un démarrage automatique géré par Quadlet
- **Optionnel :** `sudo` uniquement si vous voulez `loginctl enable-linger "$(whoami)"` pour la persistance au démarrage sur un hôte sans interface

## Démarrage rapide

<Steps>
  <Step title="Configuration initiale">
    Depuis la racine du dépôt, exécutez `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Démarrer le conteneur Gateway">
    Démarrez le conteneur avec `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Exécuter l’onboarding dans le conteneur">
    Exécutez `./scripts/run-openclaw-podman.sh launch setup`, puis ouvrez `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gérer le conteneur en cours depuis la CLI hôte">
    Définissez `OPENCLAW_CONTAINER=openclaw`, puis utilisez les commandes `openclaw` normales depuis l’hôte.
  </Step>
</Steps>

Détails de configuration :

- `./scripts/podman/setup.sh` construit `openclaw:local` dans votre stockage Podman rootless par défaut, ou utilise `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si vous en définissez une.
- Il crée `~/.openclaw/openclaw.json` avec `gateway.mode: "local"` s’il est absent.
- Il crée `~/.openclaw/.env` avec `OPENCLAW_GATEWAY_TOKEN` s’il est absent.
- Pour les lancements manuels, l’utilitaire ne lit qu’une petite liste d’autorisation de clés liées à Podman depuis `~/.openclaw/.env` et passe explicitement les variables d’environnement runtime au conteneur ; il ne transmet pas le fichier d’environnement complet à Podman.

Configuration gérée par Quadlet :

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet est une option Linux uniquement car elle dépend des services utilisateur systemd.

Vous pouvez aussi définir `OPENCLAW_PODMAN_QUADLET=1`.

Variables d’environnement optionnelles de build/configuration :

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- utiliser une image existante/téléchargée au lieu de construire `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installer des paquets apt supplémentaires pendant la construction de l’image
- `OPENCLAW_EXTENSIONS` -- préinstaller les dépendances de plugins au moment du build

Démarrage du conteneur :

```bash
./scripts/run-openclaw-podman.sh launch
```

Le script démarre le conteneur avec votre uid/gid actuel via `--userns=keep-id` et monte par liaison votre état OpenClaw dans le conteneur.

Onboarding :

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ouvrez ensuite `http://127.0.0.1:18789/` et utilisez le jeton de `~/.openclaw/.env`.

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

Sur macOS, Podman machine peut faire apparaître le navigateur comme non local pour la Gateway.
Si la Control UI signale des erreurs d’authentification appareil après le lancement, utilisez les recommandations Tailscale dans
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Pour HTTPS ou l’accès distant au navigateur, suivez la documentation principale Tailscale.

Remarque spécifique à Podman :

- Gardez l’hôte de publication Podman sur `127.0.0.1`.
- Préférez `tailscale serve` géré par l’hôte à `openclaw gateway --tailscale serve`.
- Sur macOS, si le contexte d’authentification appareil du navigateur local n’est pas fiable, utilisez l’accès Tailscale au lieu de solutions de tunnel local ad hoc.

Voir :

- [Tailscale](/fr/gateway/tailscale)
- [Control UI](/fr/web/control-ui)

## Systemd (Quadlet, optionnel)

Si vous avez exécuté `./scripts/podman/setup.sh --quadlet`, la configuration installe un fichier Quadlet à :

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

Pour la persistance au démarrage sur des hôtes SSH/sans interface, activez le lingering pour votre utilisateur actuel :

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config, env et stockage

- **Répertoire de configuration :** `~/.openclaw`
- **Répertoire d’espace de travail :** `~/.openclaw/workspace`
- **Fichier de jeton :** `~/.openclaw/.env`
- **Utilitaire de lancement :** `./scripts/run-openclaw-podman.sh`

Le script de lancement et Quadlet montent l’état hôte dans le conteneur :

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Par défaut, ce sont des répertoires hôte, pas un état anonyme de conteneur, donc
`openclaw.json`, les `auth-profiles.json` par agent, l’état des canaux/fournisseurs,
les sessions et l’espace de travail survivent au remplacement du conteneur.
La configuration Podman initialise aussi `gateway.controlUi.allowedOrigins` pour `127.0.0.1` et `localhost` sur le port publié de la Gateway afin que le dashboard local fonctionne avec la liaison non-loopback du conteneur.

Variables d’environnement utiles pour le lanceur manuel :

- `OPENCLAW_PODMAN_CONTAINER` -- nom du conteneur (`openclaw` par défaut)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image à exécuter
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hôte mappé sur le conteneur `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hôte mappé sur le conteneur `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface hôte pour les ports publiés ; la valeur par défaut est `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode de liaison de la Gateway à l’intérieur du conteneur ; la valeur par défaut est `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (par défaut), `auto` ou `host`

Le lanceur manuel lit `~/.openclaw/.env` avant de finaliser les valeurs par défaut du conteneur/de l’image, vous pouvez donc les y conserver.

Si vous utilisez un `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` non par défaut, définissez les mêmes variables pour `./scripts/podman/setup.sh` et pour les commandes ultérieures `./scripts/run-openclaw-podman.sh launch`. Le lanceur local au dépôt ne conserve pas les remplacements de chemin personnalisés d’un shell à l’autre.

Remarque Quadlet :

- Le service Quadlet généré conserve volontairement une forme par défaut fixe et durcie : ports publiés sur `127.0.0.1`, `--bind lan` à l’intérieur du conteneur, et espace de noms utilisateur `keep-id`.
- Il fixe `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` et `TimeoutStartSec=300`.
- Il publie à la fois `127.0.0.1:18789:18789` (Gateway) et `127.0.0.1:18790:18790` (bridge).
- Il lit `~/.openclaw/.env` comme `EnvironmentFile` runtime pour des valeurs telles que `OPENCLAW_GATEWAY_TOKEN`, mais il ne consomme pas la liste d’autorisation des remplacements spécifiques à Podman du lanceur manuel.
- Si vous avez besoin de ports publiés personnalisés, d’un hôte de publication différent ou d’autres indicateurs d’exécution du conteneur, utilisez le lanceur manuel ou modifiez directement `~/.config/containers/systemd/openclaw.container`, puis rechargez et redémarrez le service.

## Commandes utiles

- **Journaux du conteneur :** `podman logs -f openclaw`
- **Arrêter le conteneur :** `podman stop openclaw`
- **Supprimer le conteneur :** `podman rm -f openclaw`
- **Ouvrir l’URL du dashboard depuis la CLI hôte :** `openclaw dashboard --no-open`
- **Santé/état via la CLI hôte :** `openclaw gateway status --deep` (sonde RPC + scan supplémentaire
  des services)

## Dépannage

- **Permission refusée (EACCES) sur la configuration ou l’espace de travail :** Le conteneur s’exécute avec `--userns=keep-id` et `--user <your uid>:<your gid>` par défaut. Assurez-vous que les chemins de configuration/espace de travail hôte appartiennent à votre utilisateur actuel.
- **Démarrage de la Gateway bloqué (absence de `gateway.mode=local`) :** Assurez-vous que `~/.openclaw/openclaw.json` existe et définit `gateway.mode="local"`. `scripts/podman/setup.sh` le crée s’il est absent.
- **Les commandes CLI du conteneur visent la mauvaise cible :** Utilisez explicitement `openclaw --container <name> ...`, ou exportez `OPENCLAW_CONTAINER=<name>` dans votre shell.
- **`openclaw update` échoue avec `--container` :** C’est attendu. Reconstruisez/téléchargez l’image, puis redémarrez le conteneur ou le service Quadlet.
- **Le service Quadlet ne démarre pas :** Exécutez `systemctl --user daemon-reload`, puis `systemctl --user start openclaw.service`. Sur les systèmes sans interface, vous pouvez aussi avoir besoin de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloque les montages bind :** Laissez le comportement de montage par défaut tel quel ; le lanceur ajoute automatiquement `:Z` sous Linux lorsque SELinux est en mode enforcing ou permissive.

## Voir aussi

- [Docker](/fr/install/docker)
- [Processus d’arrière-plan Gateway](/fr/gateway/background-process)
- [Dépannage de la Gateway](/fr/gateway/troubleshooting)
