---
read_when:
    - Vous souhaitez un bot assistant Zalo personnel avec connexion par code QR
    - Vous installez ou dépannez le plugin de canal openclaw-zaloclawbot
summary: Configuration du canal Zalo ClawBot via le plugin externe openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T02:22:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se connect à Zalo ClawBot via le plugin externe `@zalo-platforms/openclaw-zaloclawbot` répertorié dans le catalogue. La connexion utilise un code QR de Zalo Mini App ; l’identifiant du plugin dans la configuration est `openclaw-zaloclawbot`.

## Compatibilité

| Version du plugin | Version d’OpenClaw | dist-tag npm | État          |
| ----------------- | ------------------ | ------------ | ------------- |
| 0.1.4             | >=2026.4.10        | `latest`     | Actif / Bêta  |

## Prérequis

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) installé (CLI `openclaw` disponible)
- Un compte Zalo sur un appareil mobile pour scanner le code QR de connexion

## Installation avec l’assistant d’intégration (recommandée)

```bash
openclaw onboard
```

Sélectionnez **Zalo ClawBot** dans le menu des canaux. L’assistant installe le plugin depuis le catalogue officiel (avec vérification de l’intégrité), affiche le code QR de connexion dans le terminal et finalise la configuration du canal une fois que vous l’avez scanné avec l’application Zalo.

## Installation manuelle

Pour ajouter le canal à un Gateway déjà configuré :

### 1. Installer le plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Utilisez précisément cette version épinglée afin qu’OpenClaw vérifie le paquet par rapport à l’empreinte d’intégrité du catalogue lors de l’installation.

### 2. Activer le plugin dans la configuration

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Générer un code QR et se connecter

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scannez le code QR affiché dans le terminal avec l’application mobile Zalo, acceptez les conditions d’utilisation dans la Zalo Mini App et autorisez la session.

### 4. Redémarrer le Gateway

```bash
openclaw gateway restart
```

## Fonctionnement

Contrairement au canal Zalo standard, qui nécessite d’enregistrer votre propre compte officiel Zalo (OA) et de configurer des identifiants de développement statiques, Zalo ClawBot est un **assistant personnel lié à son propriétaire** reposant sur une infrastructure officielle partagée :

1. **Intégration :** le code QR ouvre une Zalo Mini App qui associe directement à votre identifiant utilisateur Zalo un nouveau bot privé, provisionné sous un compte officiel partagé.
2. **Confidentialité liée au propriétaire :** le bot communique uniquement avec son propriétaire. Les messages des autres utilisateurs sont rejetés au niveau de la plateforme.
3. **Accès par l’API officielle :** le plugin utilise les API de Zalo Bot Platform, et non l’automatisation d’un navigateur ou d’une session Web.

## Fonctionnement interne

Le plugin communique avec Zalo au moyen d’une boucle persistante d’interrogation longue (`getUpdates`). Les Webhooks sont désactivés par défaut lors de l’exécution locale du Gateway depuis un ordinateur ou un terminal. Les messages sont traités côté client et transmis à l’environnement d’exécution de votre agent local.

Le plugin gère les identifiants du bot dans le répertoire d’état d’OpenClaw. Considérez ce répertoire comme sensible et appliquez-lui la même politique de contrôle d’accès et de sauvegarde qu’au reste de l’état d’OpenClaw.

L’environnement d’exécution de ce plugin réside entièrement dans le paquet externe `@zalo-platforms/openclaw-zaloclawbot` ; les détails de comportement ci-dessous, au-delà de l’installation et de la configuration, sont ceux indiqués par les responsables du plugin et n’ont pas été vérifiés par rapport au code source du cœur d’OpenClaw.

## Résolution des problèmes

- **Expiration de la connexion par code QR :** le jeton de connexion (`zbsk`) expire après 5 minutes pour des raisons de sécurité. Si le code QR expire avant que vous ne le scanniez, exécutez de nouveau la commande de connexion pour en générer un autre.
- **Échec du chargement du Gateway :** vérifiez que la version d’OpenClaw sur votre hôte est `2026.4.10` ou ultérieure. Les versions antérieures ne prennent pas en charge le registre d’installation des plugins npm externes requis par cet identifiant.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Zalo](/fr/channels/zalo) - le canal intégré Zalo Bot Creator / Marketplace
- [Appairage](/fr/channels/pairing) - authentification par message privé et processus d’appairage
- [Plugins](/fr/tools/plugin) - installation et gestion des plugins
