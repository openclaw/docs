---
read_when:
    - Exécution de plusieurs Gateway sur la même machine
    - Vous avez besoin d’une configuration, d’un état et de ports isolés pour chaque Gateway
summary: Exécuter plusieurs Gateways OpenClaw sur un même hôte (isolation, ports et profils)
title: Plusieurs gateways
x-i18n:
    generated_at: "2026-07-16T13:11:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La plupart des configurations ne nécessitent qu’un seul Gateway : un Gateway unique gère plusieurs connexions de messagerie et agents. N’exécutez des Gateways distincts avec des profils/ports isolés que lorsqu’une isolation renforcée ou une redondance est nécessaire (par exemple, un bot de secours).

## Démarrage rapide du bot de secours

La configuration la plus simple pour un bot de secours :

- Conservez le bot principal sur le profil par défaut.
- Exécutez le bot de secours sur `--profile rescue`, avec son propre jeton de bot Telegram.
- Attribuez au bot de secours un port de base différent, par exemple `19789`.

Ainsi, le bot de secours peut continuer à diagnostiquer les problèmes ou à appliquer des modifications de configuration si le bot principal est indisponible. Laissez au moins 20 ports entre les ports de base afin que les ports dérivés du navigateur/CDP n’entrent jamais en conflit.

```bash
# Bot de secours (bot Telegram distinct, profil distinct, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal est déjà en cours d’exécution, cela suffit généralement. Si l’intégration initiale a déjà installé le service de secours, ignorez la dernière commande `gateway install`.

Pendant `openclaw --profile rescue onboard` :

- Utilisez un jeton de bot Telegram distinct, dédié au compte de secours (facile à réserver aux opérateurs, indépendant de l’installation du canal/de l’application du bot principal et offrant un moyen simple de récupération par message privé).
- Conservez le nom de profil `rescue`.
- Utilisez un port de base supérieur d’au moins 20 à celui du bot principal.
- Acceptez l’espace de travail de secours par défaut, sauf si vous en gérez déjà un vous-même.

### Modifications apportées par `--profile rescue onboard`

`--profile rescue onboard` exécute le processus normal d’intégration initiale, mais écrit toutes les données dans un profil distinct. Le bot de secours dispose ainsi de ses propres éléments :

- Fichier de profil/configuration
- Répertoire d’état
- Espace de travail (par défaut : `~/.openclaw/workspace-rescue`)
- Nom du service géré
- Port de base (ainsi que les ports dérivés)
- Jeton de bot Telegram

Les invites sont par ailleurs identiques à celles de l’intégration initiale normale.

## Configuration générale de plusieurs Gateways

Le même modèle d’isolation fonctionne pour n’importe quelle paire ou n’importe quel groupe de Gateways sur un même hôte : attribuez à chaque Gateway supplémentaire son propre profil nommé et son propre port de base :

```bash
# principal (profil par défaut)
openclaw setup
openclaw gateway --port 18789

# Gateway supplémentaire
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Il est également possible d’utiliser des profils nommés des deux côtés :

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Les services suivent le même modèle :

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Utilisez le démarrage rapide du bot de secours pour disposer d’une voie opérateur de repli ; utilisez le modèle général de profils pour plusieurs Gateways durables couvrant différents canaux, locataires, espaces de travail ou rôles opérationnels.

## Liste de contrôle de l’isolation

Veillez à ce que les éléments suivants soient uniques pour chaque instance de Gateway :

| Paramètre                      | Objectif                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | Fichier de configuration propre à l’instance             |
| `OPENCLAW_STATE_DIR`         | Sessions, identifiants et caches propres à l’instance |
| `agents.defaults.workspace`  | Racine de l’espace de travail propre à l’instance          |
| `gateway.port` (ou `--port`) | Unique pour chaque instance                  |
| Ports dérivés du navigateur/CDP    | Voir ci-dessous                            |

Le partage de l’un de ces éléments entraîne des conflits de configuration, d’état ou de ports. Le démarrage du Gateway
impose que chaque répertoire d’état appartienne à une instance unique, même lorsque
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` ignore l’instance unique par configuration.

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port du service de contrôle du navigateur = base + 2 (boucle locale uniquement).
- L’hôte Canvas est servi directement sur le serveur HTTP du Gateway (même port que `gateway.port`).
- Les ports CDP des profils de navigateur sont automatiquement attribués de `browser control port + 9` à `+ 108`.

Si vous remplacez l’une de ces valeurs dans la configuration ou l’environnement, vous devez veiller à ce qu’elle reste unique pour chaque instance.

## Remarques sur le navigateur/CDP (piège fréquent)

- Ne fixez **pas** `browser.cdpUrl` à la même valeur sur plusieurs instances.
- Chaque instance nécessite son propre port de contrôle du navigateur et sa propre plage CDP (dérivés de son port de Gateway).
- Pour des ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` pour chaque instance.
- Pour une instance Chrome distante, utilisez `browser.profiles.<name>.cdpUrl` (par profil et par instance).

## Exemple d’environnement manuel

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Vérifications rapides

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` détecte les services launchd/systemd/schtasks obsolètes provenant d’anciennes installations.
- Un texte d’avertissement de `gateway probe`, tel que `multiple reachable gateway identities detected`, n’est attendu que lorsque vous exécutez intentionnellement plusieurs Gateways isolés, ou lorsqu’OpenClaw ne peut pas prouver que les cibles de vérification accessibles correspondent au même Gateway. Un tunnel SSH, une URL de proxy ou une URL distante configurée pointant vers le même Gateway représente un seul Gateway avec plusieurs transports, même lorsque les ports de transport diffèrent.

## Voir aussi

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Verrou du Gateway](/fr/gateway/gateway-lock)
- [Configuration](/fr/gateway/configuration)
