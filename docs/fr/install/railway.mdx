---
read_when:
    - Déployer OpenClaw sur Railway
    - Vous souhaitez un déploiement cloud en un clic avec une interface de contrôle accessible depuis le navigateur
summary: Déployez OpenClaw sur Railway avec un modèle en un clic
title: Railway
x-i18n:
    generated_at: "2026-07-12T02:46:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Déployez OpenClaw sur Railway à l’aide d’un modèle en un clic et accédez-y via l’interface Web de contrôle. Il s’agit de la méthode la plus simple « sans terminal sur le serveur » : Railway exécute le Gateway pour vous.

## Déploiement en un clic

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Déployer sur Railway
</a>

<Steps>
  <Step title="Déployer le modèle">
    Cliquez sur **Deploy on Railway** ci-dessus.
  </Step>

<Step title="Ajouter un volume">
  Attachez un volume monté sur `/data` (requis pour la persistance de l’état).
</Step>

  <Step title="Définir les variables">
    Définissez les **Variables** requises pour le service :

    - `OPENCLAW_GATEWAY_PORT=8080` (requis — doit correspondre au port dans Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (requis ; traitez-le comme un secret d’administration)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (recommandé)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recommandé)

  </Step>

<Step title="Activer le réseau public">
  Sous **Public Networking**, activez **HTTP Proxy** pour le service sur le port `8080`.
</Step>

  <Step title="Se connecter">
    Recherchez votre URL publique dans **Railway -> your service -> Settings -> Domains** — soit un domaine généré (souvent `https://<something>.up.railway.app`), soit le domaine personnalisé que vous avez associé.

    Ouvrez `https://<your-railway-domain>/openclaw` et connectez-vous à l’aide du secret partagé configuré. Par défaut, le modèle utilise `OPENCLAW_GATEWAY_TOKEN` ; si vous le remplacez par une authentification par mot de passe, utilisez plutôt ce mot de passe.

  </Step>
</Steps>

## Ce que vous obtenez

- Gateway OpenClaw hébergé avec l’interface de contrôle
- Stockage persistant via le volume Railway (`/data`), afin que `openclaw.json`, les fichiers `auth-profiles.json` propres à chaque agent, l’état des canaux et des fournisseurs, les sessions et l’espace de travail soient conservés lors des redéploiements

## Connecter un canal

Utilisez l’interface de contrôle à l’adresse `/openclaw` ou exécutez `openclaw onboard` dans le shell de Railway pour obtenir les instructions de configuration des canaux :

- [Discord](/fr/channels/discord)
- [Telegram](/fr/channels/telegram) (le plus rapide — un simple jeton de bot suffit)
- [Tous les canaux](/fr/channels)

## Sauvegardes et migration

Exportez votre état, votre configuration, vos profils d’authentification et votre espace de travail :

```bash
openclaw backup create
```

Cette commande crée une archive de sauvegarde portable contenant l’état d’OpenClaw ainsi que tout espace de travail configuré. Consultez la section [Sauvegarde](/fr/cli/backup) pour plus de détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)
