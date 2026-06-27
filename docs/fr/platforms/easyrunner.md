---
read_when:
    - Déployer OpenClaw sur EasyRunner
    - Exécuter le Gateway derrière le proxy Caddy d’EasyRunner
    - Choisir les volumes persistants et l’authentification pour un Gateway hébergé
summary: Exécuter le Gateway OpenClaw sur EasyRunner avec Podman et Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:42:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner peut héberger le Gateway OpenClaw sous forme de petite application conteneurisée derrière son
proxy Caddy. Ce guide suppose un hôte EasyRunner qui exécute des applications
Compose compatibles avec Podman et expose HTTPS via Caddy.

## Avant de commencer

- Un serveur EasyRunner avec un domaine qui pointe vers lui.
- Une image de conteneur OpenClaw construite ou publiée.
- Un volume de configuration persistant pour `/home/node/.openclaw`.
- Un volume d’espace de travail persistant pour `/workspace`.
- Un jeton ou mot de passe Gateway robuste.

Gardez l’authentification des appareils activée lorsque c’est possible. Si votre déploiement de proxy inverse ne peut pas
transmettre correctement l’identité de l’appareil, corrigez d’abord les paramètres de proxy approuvé ; n’utilisez
les contournements d’authentification dangereux que pour un réseau entièrement privé et contrôlé par l’opérateur.

## Application Compose

Créez une application EasyRunner avec un fichier Compose structuré comme ceci :

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Remplacez `openclaw.example.com` par le nom d’hôte de votre Gateway. Stockez
`OPENCLAW_GATEWAY_TOKEN` dans le gestionnaire de secrets/environnement d’EasyRunner au lieu de
le valider dans la définition de l’application.

## Configurer OpenClaw

Dans le volume de configuration persistant, gardez le Gateway accessible uniquement via
le proxy et exigez l’authentification :

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Si Caddy termine TLS pour le Gateway, configurez les paramètres de proxy approuvé pour
le chemin de proxy exact plutôt que de désactiver globalement les vérifications d’authentification. Consultez
[Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth).

## Vérifier

Depuis votre poste de travail :

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Depuis l’hôte EasyRunner, vérifiez dans les journaux de l’application que le Gateway est à l’écoute et qu’il n’y a
aucun échec au démarrage lié à SecretRef, aux Plugins ou à l’authentification des canaux.

## Mises à jour et sauvegardes

- Récupérez ou construisez la nouvelle image OpenClaw, puis redéployez l’application EasyRunner.
- Sauvegardez le volume `openclaw-config` avant les mises à jour.
- Sauvegardez `openclaw-workspace` si les agents y écrivent des données de projet durables.
- Exécutez `openclaw doctor` après les mises à jour majeures pour détecter les migrations de configuration et
  les avertissements de service.

## Dépannage

- `gateway probe` ne peut pas se connecter : confirmez que le nom d’hôte Caddy pointe vers l’application
  et que le conteneur écoute sur `0.0.0.0:1455`.
- L’authentification échoue : effectuez une rotation du jeton dans les secrets EasyRunner et dans la commande
  du client local en même temps.
- Les fichiers appartiennent à root après la restauration : réparez les volumes montés afin que
  l’utilisateur du conteneur puisse écrire dans `/home/node/.openclaw` et `/workspace`.
- Les Plugins de navigateur ou de canal échouent : vérifiez si les binaires externes requis,
  la sortie réseau et les identifiants montés sont disponibles dans le conteneur.
