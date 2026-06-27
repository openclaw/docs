---
read_when:
    - Exécuter plusieurs Gateway sur la même machine
    - Vous avez besoin d’une configuration, d’un état et de ports isolés par Gateway
summary: Exécuter plusieurs Gateway OpenClaw sur un même hôte (isolation, ports et profils)
title: Plusieurs gateways
x-i18n:
    generated_at: "2026-06-27T17:31:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La plupart des installations devraient utiliser un seul Gateway, car un Gateway unique peut gérer plusieurs connexions de messagerie et plusieurs agents. Si vous avez besoin d’une isolation ou d’une redondance plus forte (par exemple, un bot de secours), exécutez des Gateways séparés avec des profils/ports isolés.

## Configuration recommandée

Pour la plupart des utilisateurs, la configuration de bot de secours la plus simple est la suivante :

- garder le bot principal sur le profil par défaut
- exécuter le bot de secours avec `--profile rescue`
- utiliser un bot Telegram complètement séparé pour le compte de secours
- garder le bot de secours sur un port de base différent, comme `19789`

Cela garde le bot de secours isolé du bot principal afin qu’il puisse déboguer ou appliquer des changements de configuration si le bot principal est indisponible. Laissez au moins 20 ports entre les ports de base afin que les ports dérivés du navigateur/canvas/CDP n’entrent jamais en conflit.

## Démarrage rapide du bot de secours

Utilisez ce chemin par défaut, sauf si vous avez une raison solide de faire autre chose :

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal est déjà en cours d’exécution, c’est généralement tout ce dont vous avez besoin.

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram séparé
- gardez le profil `rescue`
- utilisez un port de base au moins 20 ports plus élevé que celui du bot principal
- acceptez l’espace de travail de secours par défaut, sauf si vous en gérez déjà un vous-même

Si l’onboarding a déjà installé le service de secours pour vous, le dernier `gateway install` n’est pas nécessaire.

## Pourquoi cela fonctionne

Le bot de secours reste indépendant, car il possède son propre :

- profil/configuration
- répertoire d’état
- espace de travail
- port de base (plus les ports dérivés)
- jeton de bot Telegram

Pour la plupart des installations, utilisez un bot Telegram complètement séparé pour le profil de secours :

- facile à réserver aux opérateurs
- jeton et identité de bot séparés
- indépendant de l’installation de canal/application du bot principal
- chemin de récupération simple basé sur les DM lorsque le bot principal est cassé

## Ce que `--profile rescue onboard` change

`openclaw --profile rescue onboard` utilise le flux d’onboarding normal, mais écrit tout dans un profil séparé.

En pratique, cela signifie que le bot de secours reçoit son propre :

- fichier de configuration
- répertoire d’état
- espace de travail (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Les invites sont sinon les mêmes que pour l’onboarding normal.

## Configuration multi-Gateway générale

La disposition de bot de secours ci-dessus est le choix par défaut le plus simple, mais le même modèle d’isolation fonctionne pour n’importe quelle paire ou groupe de Gateways sur un même hôte.

Pour une configuration plus générale, donnez à chaque Gateway supplémentaire son propre profil nommé et son propre port de base :

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si vous voulez que les deux Gateways utilisent des profils nommés, cela fonctionne aussi :

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Les services suivent le même modèle :

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Utilisez le démarrage rapide du bot de secours lorsque vous voulez une voie opérateur de repli. Utilisez le modèle général de profils lorsque vous voulez plusieurs Gateways durables pour différents canaux, locataires, espaces de travail ou rôles opérationnels.

## Liste de contrôle d’isolation

Gardez ces éléments uniques par instance de Gateway :

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants et caches par instance
- `agents.defaults.workspace` — racine d’espace de travail par instance
- `gateway.port` (ou `--port`) — unique par instance
- ports dérivés du navigateur/canvas/CDP

S’ils sont partagés, vous rencontrerez des conflits de configuration et de ports.

## Mappage des ports (dérivé)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle du navigateur = base + 2 (loopback uniquement)
- l’hôte canvas est servi sur le serveur HTTP du Gateway (même port que `gateway.port`)
- les ports CDP des profils de navigateur sont alloués automatiquement depuis `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un de ces paramètres dans la configuration ou l’environnement, vous devez les garder uniques par instance.

## Notes navigateur/CDP (piège courant)

- Ne fixez **pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle de navigateur et de sa propre plage CDP (dérivés de son port de Gateway).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

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

Interprétation :

- `gateway status --deep` aide à détecter les services launchd/systemd/schtasks obsolètes issus d’anciennes installations.
- Le texte d’avertissement de `gateway probe`, comme `multiple reachable gateway identities detected`, est attendu uniquement lorsque vous exécutez intentionnellement plus d’un Gateway isolé, ou lorsqu’OpenClaw ne peut pas prouver que les cibles de sonde accessibles sont le même Gateway. Un tunnel SSH, une URL de proxy ou une URL distante configurée vers le même Gateway correspond à un seul Gateway avec plusieurs transports, même lorsque les ports de transport diffèrent.

## Associé

- [Runbook Gateway](/fr/gateway)
- [Verrou Gateway](/fr/gateway/gateway-lock)
- [Configuration](/fr/gateway/configuration)
