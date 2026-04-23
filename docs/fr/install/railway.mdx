---
read_when:
    - Déploiement d’OpenClaw sur Railway
    - Vous voulez un déploiement cloud en un clic avec une interface de contrôle dans le navigateur
summary: Déployer OpenClaw sur Railway avec le modèle en un clic
title: Railway
x-i18n:
    generated_at: "2026-04-23T07:05:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

Déployez OpenClaw sur Railway avec un modèle en un clic et accédez-y via l’interface web Control UI.
C’est la voie la plus simple « sans terminal sur le serveur » : Railway exécute la Gateway pour vous.

## Liste de vérification rapide (nouveaux utilisateurs)

1. Cliquez sur **Deploy on Railway** (ci-dessous).
2. Ajoutez un **Volume** monté sur `/data`.
3. Définissez les **Variables** requises (au minimum `OPENCLAW_GATEWAY_PORT` et `OPENCLAW_GATEWAY_TOKEN`).
4. Activez **HTTP Proxy** sur le port `8080`.
5. Ouvrez `https://<your-railway-domain>/openclaw` et connectez-vous avec le secret partagé configuré. Ce modèle utilise `OPENCLAW_GATEWAY_TOKEN` par défaut ; si vous le remplacez par une authentification par mot de passe, utilisez plutôt ce mot de passe.

## Déploiement en un clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Après le déploiement, trouvez votre URL publique dans **Railway → votre service → Settings → Domains**.

Railway va soit :

- vous donner un domaine généré (souvent `https://<something>.up.railway.app`), soit
- utiliser votre domaine personnalisé si vous en avez attaché un.

Ouvrez ensuite :

- `https://<your-railway-domain>/openclaw` — Control UI

## Ce que vous obtenez

- Gateway OpenClaw hébergée + Control UI
- Stockage persistant via un Volume Railway (`/data`) afin que `openclaw.json`,
  `auth-profiles.json` par agent, l’état des canaux/fournisseurs, les sessions et
  l’espace de travail survivent aux redéploiements

## Paramètres Railway requis

### Réseau public

Activez **HTTP Proxy** pour le service.

- Port : `8080`

### Volume (requis)

Attachez un volume monté sur :

- `/data`

### Variables

Définissez ces variables sur le service :

- `OPENCLAW_GATEWAY_PORT=8080` (requis — doit correspondre au port dans Public Networking)
- `OPENCLAW_GATEWAY_TOKEN` (requis ; à traiter comme un secret administrateur)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (recommandé)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recommandé)

## Connecter un canal

Utilisez la Control UI sur `/openclaw` ou exécutez `openclaw onboard` via le shell de Railway pour obtenir les instructions de configuration des canaux :

- [Telegram](/fr/channels/telegram) (le plus rapide — juste un jeton de bot)
- [Discord](/fr/channels/discord)
- [Tous les canaux](/fr/channels)

## Sauvegardes et migration

Exportez votre état, votre configuration, vos profils d’authentification et votre espace de travail :

```bash
openclaw backup create
```

Cela crée une archive de sauvegarde portable avec l’état d’OpenClaw ainsi que tout
espace de travail configuré. Voir [Backup](/fr/cli/backup) pour plus de détails.

## Étapes suivantes

- Configurer des canaux de messagerie : [Canaux](/fr/channels)
- Configurer la Gateway : [Configuration de la Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)
