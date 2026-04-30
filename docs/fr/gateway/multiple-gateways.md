---
read_when:
    - Exécuter plusieurs Gateway sur la même machine
    - Il vous faut une configuration, un état et des ports isolés pour chaque Gateway.
summary: Exécuter plusieurs Gateway OpenClaw sur un même hôte (isolation, ports et profils)
title: Plusieurs Gateway
x-i18n:
    generated_at: "2026-04-30T07:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

La plupart des configurations devraient utiliser un seul Gateway, car un Gateway unique peut gérer plusieurs connexions de messagerie et plusieurs agents. Si vous avez besoin d’une isolation ou d’une redondance plus forte (par exemple, un bot de secours), exécutez des Gateways séparés avec des profils/ports isolés.

## Configuration recommandée

Pour la plupart des utilisateurs, la configuration de bot de secours la plus simple est la suivante :

- conserver le bot principal sur le profil par défaut
- exécuter le bot de secours sur `--profile rescue`
- utiliser un bot Telegram complètement séparé pour le compte de secours
- conserver le bot de secours sur un port de base différent, par exemple `19789`

Cela maintient le bot de secours isolé du bot principal afin qu’il puisse déboguer ou appliquer
des modifications de configuration si le bot principal est indisponible. Laissez au moins 20 ports entre
les ports de base afin que les ports dérivés de navigateur/canevas/CDP ne se chevauchent jamais.

## Démarrage rapide du bot de secours

Utilisez ceci comme chemin par défaut, sauf si vous avez une bonne raison de faire autre chose :

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal est déjà en cours d’exécution, c’est généralement tout ce dont vous avez besoin.

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram séparé
- conservez le profil `rescue`
- utilisez un port de base supérieur d’au moins 20 à celui du bot principal
- acceptez l’espace de travail de secours par défaut, sauf si vous en gérez déjà un vous-même

Si l’onboarding a déjà installé le service de secours pour vous, la dernière commande
`gateway install` n’est pas nécessaire.

## Pourquoi cela fonctionne

Le bot de secours reste indépendant, car il possède ses propres éléments :

- profil/configuration
- répertoire d’état
- espace de travail
- port de base (plus les ports dérivés)
- jeton de bot Telegram

Pour la plupart des configurations, utilisez un bot Telegram complètement séparé pour le profil de secours :

- facile à réserver aux opérateurs
- jeton et identité de bot séparés
- indépendant de l’installation du canal/de l’application du bot principal
- chemin de récupération simple par DM lorsque le bot principal est cassé

## Ce que `--profile rescue onboard` modifie

`openclaw --profile rescue onboard` utilise le flux d’onboarding normal, mais il
écrit tout dans un profil séparé.

En pratique, cela signifie que le bot de secours obtient ses propres éléments :

- fichier de configuration
- répertoire d’état
- espace de travail (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Les invites sont sinon les mêmes que pour l’onboarding normal.

## Configuration multi-Gateway générale

La disposition du bot de secours ci-dessus est le choix par défaut le plus simple, mais le même schéma
d’isolation fonctionne pour toute paire ou tout groupe de Gateways sur un même hôte.

Pour une configuration plus générale, donnez à chaque Gateway supplémentaire son propre profil nommé et son
propre port de base :

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si vous souhaitez que les deux Gateways utilisent des profils nommés, cela fonctionne également :

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Les services suivent le même schéma :

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Utilisez le démarrage rapide du bot de secours lorsque vous souhaitez une voie d’opérateur de repli. Utilisez le
schéma général de profils lorsque vous souhaitez plusieurs Gateways durables pour
différents canaux, locataires, espaces de travail ou rôles opérationnels.

## Liste de contrôle d’isolation

Gardez ces éléments uniques par instance de Gateway :

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants et caches par instance
- `agents.defaults.workspace` — racine d’espace de travail par instance
- `gateway.port` (ou `--port`) — unique par instance
- ports dérivés de navigateur/canevas/CDP

Si ces éléments sont partagés, vous rencontrerez des conflits de configuration et de ports.

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle du navigateur = base + 2 (loopback uniquement)
- l’hôte de canevas est servi sur le serveur HTTP du Gateway (même port que `gateway.port`)
- les ports CDP des profils de navigateur sont alloués automatiquement depuis `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un de ces éléments dans la configuration ou l’environnement, vous devez le garder unique par instance.

## Notes navigateur/CDP (piège courant)

- Ne définissez **pas** `browser.cdpUrl` sur les mêmes valeurs pour plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle de navigateur et de sa propre plage CDP (dérivés de son port de Gateway).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

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

Interprétation :

- `gateway status --deep` aide à détecter les services launchd/systemd/schtasks obsolètes provenant d’anciennes installations.
- le texte d’avertissement de `gateway probe`, comme `multiple reachable gateways detected`, est attendu uniquement lorsque vous exécutez intentionnellement plus d’un Gateway isolé.

## Connexe

- [Runbook Gateway](/fr/gateway)
- [Verrou Gateway](/fr/gateway/gateway-lock)
- [Configuration](/fr/gateway/configuration)
