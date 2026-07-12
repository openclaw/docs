---
read_when:
    - Configuration d’OpenClaw sur Hostinger
    - Vous recherchez un VPS géré pour OpenClaw
    - Utiliser OpenClaw en 1 clic avec Hostinger
summary: Héberger OpenClaw sur Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T15:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Exécutez un Gateway OpenClaw persistant sur [Hostinger](https://www.hostinger.com/openclaw), soit sous forme de déploiement géré **1-Click**, soit sous forme d’installation sur **VPS** que vous administrez vous-même.

## Prérequis

- Compte Hostinger ([inscription](https://www.hostinger.com/openclaw))
- Environ 5 à 10 minutes

## Option A : OpenClaw en 1 clic

Hostinger prend en charge l’infrastructure, Docker et les mises à jour automatiques. C’est le moyen le plus rapide d’obtenir une instance opérationnelle.

<Steps>
  <Step title="Acheter et lancer">
    1. Depuis la [page OpenClaw de Hostinger](https://www.hostinger.com/openclaw), choisissez une offre OpenClaw gérée et finalisez la commande.

    <Note>
    Lors du paiement, vous pouvez sélectionner des crédits **Ready-to-Use AI**, préachetés et immédiatement intégrés à OpenClaw : aucun compte externe ni aucune clé API d’un autre fournisseur ne sont nécessaires. Vous pouvez commencer à discuter immédiatement. Vous pouvez également fournir votre propre clé Anthropic, OpenAI, Google Gemini ou xAI lors de la configuration.
    </Note>

  </Step>

  <Step title="Sélectionner un canal de messagerie">
    Choisissez un ou plusieurs canaux à connecter :

    - **WhatsApp** -- scannez le code QR affiché dans l’assistant de configuration.
    - **Telegram** -- collez le jeton du bot fourni par [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Terminer l’installation">
    Cliquez sur **Finish** pour déployer l’instance. Une fois qu’elle est prête, accédez au tableau de bord OpenClaw depuis **OpenClaw Overview** dans hPanel.
  </Step>

</Steps>

## Option B : OpenClaw sur VPS

Cette option offre davantage de contrôle sur le serveur. Hostinger déploie OpenClaw via Docker sur votre VPS ; vous le gérez au moyen de **Docker Manager** dans hPanel.

<Steps>
  <Step title="Acheter un VPS">
    1. Depuis la [page OpenClaw de Hostinger](https://www.hostinger.com/openclaw), choisissez une offre OpenClaw sur VPS et finalisez la commande.

    <Note>
    Vous pouvez sélectionner des crédits **Ready-to-Use AI** lors du paiement. Ils sont préachetés et immédiatement intégrés à OpenClaw, ce qui vous permet de commencer à discuter sans compte externe ni clé API d’un autre fournisseur.
    </Note>

  </Step>

  <Step title="Configurer OpenClaw">
    Une fois le VPS provisionné, renseignez les champs de configuration :

    - **Gateway token** -- généré automatiquement ; enregistrez-le pour une utilisation ultérieure.
    - **WhatsApp number** -- votre numéro avec l’indicatif du pays (facultatif).
    - **Telegram bot token** -- fourni par [BotFather](https://t.me/BotFather) (facultatif).
    - **API keys** -- nécessaires uniquement si vous n’avez pas sélectionné de crédits Ready-to-Use AI lors du paiement.

  </Step>

  <Step title="Démarrer OpenClaw">
    Cliquez sur **Deploy**. Une fois OpenClaw en cours d’exécution, ouvrez son tableau de bord depuis hPanel en cliquant sur **Open**.
  </Step>

</Steps>

Les journaux, redémarrages et mises à jour sont gérés depuis l’interface Docker Manager dans hPanel. Pour effectuer une mise à jour, appuyez sur **Update** dans Docker Manager afin de récupérer la dernière image.

## Vérifier votre configuration

Envoyez « Hi » à votre assistant sur le canal que vous avez connecté. OpenClaw répond et vous guide dans la définition de vos préférences initiales.

## Résolution des problèmes

**Le tableau de bord ne se charge pas** -- Attendez quelques minutes que le provisionnement du conteneur se termine, puis consultez les journaux de Docker Manager dans hPanel.

**Le conteneur Docker redémarre sans cesse** -- Ouvrez les journaux de Docker Manager et recherchez les erreurs de configuration, par exemple des jetons manquants ou des clés API non valides.

**Le bot Telegram ne répond pas** -- Si l’association des messages privés est requise, un expéditeur inconnu reçoit un court code d’association au lieu d’une réponse. Approuvez-le depuis la conversation du tableau de bord OpenClaw, ou avec `openclaw pairing approve telegram <CODE>` si vous disposez d’un accès shell au conteneur. Consultez [Association](/fr/channels/pairing).

## Étapes suivantes

- [Canaux](/fr/channels) -- connectez Telegram, WhatsApp, Discord et d’autres services
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration

## Pages connexes

- [Présentation de l’installation](/fr/install)
- [Hébergement sur VPS](/fr/vps)
- [DigitalOcean](/fr/install/digitalocean)
