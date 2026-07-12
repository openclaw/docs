---
read_when:
    - Déployer OpenClaw sur EasyRunner
    - Exécution du Gateway derrière le proxy Caddy d’EasyRunner
    - Choisir des volumes persistants et l’authentification pour un Gateway hébergé
summary: Exécuter le Gateway OpenClaw sur EasyRunner avec Podman et Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T03:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner héberge le Gateway OpenClaw sous la forme d’une petite application conteneurisée derrière son
proxy Caddy. Ce guide suppose que l’hôte EasyRunner exécute des applications Compose compatibles
avec Podman et assure la terminaison HTTPS via Caddy.

## Avant de commencer

- Un serveur EasyRunner avec un domaine qui pointe vers celui-ci.
- L’image officielle d’OpenClaw (`ghcr.io/openclaw/openclaw`) ou votre propre version.
- Un volume de configuration persistant pour `/home/node/.openclaw`.
- Un volume d’espace de travail persistant pour `/home/node/.openclaw/workspace`.
- Un jeton ou un mot de passe robuste pour le Gateway.

Conservez l’authentification des appareils activée lorsque cela est possible. Si votre proxy inverse ne peut pas transmettre
correctement l’identité de l’appareil, corrigez d’abord les paramètres de proxy de confiance (voir
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)) ; n’utilisez les contournements
dangereux de l’authentification que sur un réseau entièrement privé et contrôlé par l’opérateur.

## Application Compose

Créez une application EasyRunner avec un fichier Compose structuré comme suit :

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Remplacez `openclaw.example.com` par le nom d’hôte de votre Gateway. Stockez
`OPENCLAW_GATEWAY_TOKEN` dans le gestionnaire de secrets ou de variables d’environnement d’EasyRunner plutôt que de
l’intégrer à la définition de l’application. Par défaut, l’image se lie à local loopback ;
les options explicites `--bind lan --port 1455` dans `command` sont donc nécessaires pour que Caddy puisse
atteindre le conteneur.

## Configurer OpenClaw

Dans le volume de configuration persistant, veillez à ce que le Gateway ne soit accessible que par
l’intermédiaire du proxy et exigez une authentification :

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

Si Caddy assure la terminaison TLS pour le Gateway, configurez les paramètres de proxy de confiance pour
le chemin exact du proxy plutôt que de désactiver globalement les contrôles d’authentification. Consultez
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).

## Vérifier

Depuis votre poste de travail :

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Depuis l’hôte EasyRunner, `GET /healthz` (état de fonctionnement) et `GET /readyz`
(état de préparation) ne nécessitent aucune authentification et servent au contrôle d’état
intégré du conteneur de l’image. Vérifiez également dans les journaux de l’application que le Gateway est à l’écoute et qu’aucun échec
lié à SecretRef, à un Plugin ou à l’authentification d’un canal ne survient au démarrage.

## Mises à jour et sauvegardes

- Récupérez ou construisez la nouvelle image OpenClaw, puis redéployez l’application EasyRunner.
- Sauvegardez le volume `openclaw-config` avant les mises à jour. Il contient
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` et l’état des paquets
  de plugins installés.
- Sauvegardez `openclaw-workspace` si les agents y écrivent des données de projet persistantes.
- Exécutez `openclaw doctor` après les mises à jour majeures afin de détecter les migrations de configuration et
  les avertissements de service.

## Dépannage

- `gateway probe` ne parvient pas à se connecter : vérifiez que le nom d’hôte Caddy pointe vers l’application
  et que le conteneur écoute sur `0.0.0.0:1455`.
- L’authentification échoue : renouvelez simultanément le jeton dans les secrets EasyRunner et dans la commande
  du client local.
- Les fichiers appartiennent à root après une restauration : l’image s’exécute en tant que `node` (uid 1000) ;
  corrigez les volumes montés afin que cet utilisateur puisse écrire dans
  `/home/node/.openclaw` et `/home/node/.openclaw/workspace`.
- Les plugins de navigateur ou de canal échouent : vérifiez que les binaires externes requis,
  la sortie réseau et les identifiants montés sont disponibles dans le
  conteneur.
