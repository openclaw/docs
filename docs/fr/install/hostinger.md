---
read_when:
    - Configurer OpenClaw sur Hostinger
    - À la recherche d’un VPS géré pour OpenClaw
    - Utiliser l’installation OpenClaw en 1 clic de Hostinger
summary: Héberger OpenClaw sur Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T07:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Exécutez un Gateway OpenClaw persistant sur [Hostinger](https://www.hostinger.com/openclaw) via un déploiement géré en **1 clic** ou une installation sur **VPS**.

## Prérequis

- Compte Hostinger ([inscription](https://www.hostinger.com/openclaw))
- Environ 5 à 10 minutes

## Option A : OpenClaw en 1 clic

Le moyen le plus rapide pour commencer. Hostinger gère l’infrastructure, Docker et les mises à jour automatiques.

<Steps>
  <Step title="Acheter et lancer">
    1. Depuis la [page Hostinger OpenClaw](https://www.hostinger.com/openclaw), choisissez un plan OpenClaw géré et terminez le paiement.

    <Note>
    Pendant le paiement, vous pouvez sélectionner des crédits **Ready-to-Use AI** préachetés et intégrés instantanément dans OpenClaw -- aucun compte externe ni clé API d’autres fournisseurs n’est nécessaire. Vous pouvez commencer à discuter immédiatement. Vous pouvez aussi fournir votre propre clé Anthropic, OpenAI, Google Gemini ou xAI pendant la configuration.
    </Note>

  </Step>

  <Step title="Sélectionner un canal de messagerie">
    Choisissez un ou plusieurs canaux à connecter :

    - **WhatsApp** -- scannez le code QR affiché dans l’assistant de configuration.
    - **Telegram** -- collez le jeton du bot depuis [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Terminer l’installation">
    Cliquez sur **Finish** pour déployer l’instance. Une fois prête, accédez au tableau de bord OpenClaw depuis **OpenClaw Overview** dans hPanel.
  </Step>

</Steps>

## Option B : OpenClaw sur VPS

Davantage de contrôle sur votre serveur. Hostinger déploie OpenClaw via Docker sur votre VPS et vous le gérez via le **Docker Manager** dans hPanel.

<Steps>
  <Step title="Acheter un VPS">
    1. Depuis la [page Hostinger OpenClaw](https://www.hostinger.com/openclaw), choisissez un plan OpenClaw sur VPS et terminez le paiement.

    <Note>
    Vous pouvez sélectionner des crédits **Ready-to-Use AI** pendant le paiement -- ils sont préachetés et intégrés instantanément dans OpenClaw, ce qui vous permet de commencer à discuter sans aucun compte externe ni clé API d’autres fournisseurs.
    </Note>

  </Step>

  <Step title="Configurer OpenClaw">
    Une fois le VPS provisionné, remplissez les champs de configuration :

    - **Gateway token** -- généré automatiquement ; enregistrez-le pour plus tard.
    - **WhatsApp number** -- votre numéro avec indicatif de pays (facultatif).
    - **Telegram bot token** -- depuis [BotFather](https://t.me/BotFather) (facultatif).
    - **API keys** -- nécessaires uniquement si vous n’avez pas sélectionné de crédits Ready-to-Use AI pendant le paiement.

  </Step>

  <Step title="Démarrer OpenClaw">
    Cliquez sur **Deploy**. Une fois lancé, ouvrez le tableau de bord OpenClaw depuis hPanel en cliquant sur **Open**.
  </Step>

</Steps>

Les journaux, redémarrages et mises à jour sont gérés directement depuis l’interface Docker Manager dans hPanel. Pour mettre à jour, cliquez sur **Update** dans Docker Manager ; cela récupérera la dernière image.

## Vérifier votre configuration

Envoyez « Hi » à votre assistant sur le canal que vous avez connecté. OpenClaw répondra et vous guidera dans les préférences initiales.

## Dépannage

**Le tableau de bord ne se charge pas** -- Attendez quelques minutes que le conteneur termine son provisionnement. Vérifiez les journaux Docker Manager dans hPanel.

**Le conteneur Docker redémarre sans cesse** -- Ouvrez les journaux Docker Manager et recherchez des erreurs de configuration (jetons manquants, clés API invalides).

**Le bot Telegram ne répond pas** -- Envoyez votre message de code de pairing depuis Telegram directement comme message dans votre discussion OpenClaw pour terminer la connexion.

## Prochaines étapes

- [Canaux](/fr/channels) -- connecter Telegram, WhatsApp, Discord, et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Hébergement VPS](/fr/vps)
- [DigitalOcean](/fr/install/digitalocean)
