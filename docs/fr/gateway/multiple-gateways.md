---
read_when:
    - Exécuter plus d’une Gateway sur la même machine
    - Vous avez besoin d’une isolation de la configuration, de l’état et des ports pour chaque Gateway
summary: Exécuter plusieurs Gateways OpenClaw sur un seul hôte (isolation, ports et profils)
title: Gateways multiples
x-i18n:
    generated_at: "2026-04-25T13:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

La plupart des configurations devraient utiliser une seule Gateway, car une Gateway unique peut gérer plusieurs connexions de messagerie et plusieurs agents. Si vous avez besoin d’une isolation plus forte ou de redondance (par exemple, un bot de secours), exécutez des Gateways distinctes avec des profils/ports isolés.

## Configuration recommandée

Pour la plupart des utilisateurs, la configuration la plus simple pour un bot de secours est :

- conserver le bot principal sur le profil par défaut
- exécuter le bot de secours sur `--profile rescue`
- utiliser un bot Telegram totalement distinct pour le compte de secours
- garder le bot de secours sur un port de base différent, par exemple `19789`

Cela permet d’isoler le bot de secours du bot principal afin qu’il puisse déboguer ou appliquer
des modifications de configuration si le bot principal est hors service. Laissez au moins 20 ports entre les
ports de base afin que les ports dérivés browser/canvas/CDP n’entrent jamais en conflit.

## Démarrage rapide du bot de secours

Utilisez cette méthode par défaut, sauf si vous avez une bonne raison de faire
autrement :

```bash
# Bot de secours (bot Telegram distinct, profil distinct, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal fonctionne déjà, c’est généralement tout ce dont vous avez besoin.

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram distinct
- conservez le profil `rescue`
- utilisez un port de base au moins 20 plus élevé que celui du bot principal
- acceptez le workspace de secours par défaut sauf si vous en gérez déjà un vous-même

Si l’onboarding a déjà installé le service de secours pour vous, la commande finale
`gateway install` n’est pas nécessaire.

## Pourquoi cela fonctionne

Le bot de secours reste indépendant parce qu’il a ses propres :

- profil/configuration
- répertoire d’état
- workspace
- port de base (plus les ports dérivés)
- jeton de bot Telegram

Pour la plupart des configurations, utilisez un bot Telegram totalement distinct pour le profil de secours :

- facile à limiter aux opérateurs uniquement
- jeton et identité de bot séparés
- indépendant de l’installation du canal/de l’application du bot principal
- chemin de récupération simple basé sur les messages privés lorsque le bot principal est en panne

## Ce que change `--profile rescue onboard`

`openclaw --profile rescue onboard` utilise le flux normal d’onboarding, mais il
écrit tout dans un profil distinct.

En pratique, cela signifie que le bot de secours obtient ses propres :

- fichier de configuration
- répertoire d’état
- workspace (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Les invites sont sinon identiques à celles de l’onboarding normal.

## Configuration générale multi-Gateway

La disposition du bot de secours ci-dessus est le choix par défaut le plus simple, mais le même modèle
d’isolation fonctionne pour toute paire ou groupe de Gateways sur un même hôte.

Pour une configuration plus générale, donnez à chaque Gateway supplémentaire son propre profil nommé et son
propre port de base :

```bash
# principale (profil par défaut)
openclaw setup
openclaw gateway --port 18789

# Gateway supplémentaire
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si vous souhaitez que les deux Gateways utilisent des profils nommés, cela fonctionne aussi :

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

Utilisez le démarrage rapide du bot de secours lorsque vous voulez une voie opérateur de secours. Utilisez le
modèle général par profil lorsque vous voulez plusieurs Gateways persistantes pour
différents canaux, locataires, workspaces ou rôles opérationnels.

## Checklist d’isolation

Gardez ces éléments uniques pour chaque instance de Gateway :

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants et caches par instance
- `agents.defaults.workspace` — racine de workspace par instance
- `gateway.port` (ou `--port`) — unique par instance
- ports browser/canvas/CDP dérivés

Si ces éléments sont partagés, vous rencontrerez des courses de configuration et des conflits de ports.

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle browser = base + 2 (loopback uniquement)
- canvas host est servi sur le serveur HTTP Gateway (même port que `gateway.port`)
- les ports CDP des profils browser sont alloués automatiquement à partir de `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un d’eux dans la configuration ou l’environnement, vous devez les garder uniques par instance.

## Remarques sur browser/CDP (piège courant)

- **N’épinglez pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle browser et de sa propre plage CDP (dérivée de son port Gateway).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

## Exemple manuel avec variables d’environnement

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

Interprétation :

- `gateway status --deep` aide à détecter les services launchd/systemd/schtasks obsolètes provenant d’anciennes installations.
- Le texte d’avertissement de `gateway probe`, tel que `multiple reachable gateways detected`, n’est attendu que lorsque vous exécutez intentionnellement plusieurs Gateways isolées.

## Liens associés

- [Runbook de la Gateway](/fr/gateway)
- [Verrou de Gateway](/fr/gateway/gateway-lock)
- [Configuration](/fr/gateway/configuration)
