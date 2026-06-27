---
read_when:
    - Vous voulez un bot assistant Zalo personnel avec connexion par code QR
    - Vous installez ou dépannez le plugin de canal openclaw-zaloclawbot
summary: Configuration du canal Zalo ClawBot via le plugin externe openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se connecte à Zalo ClawBot via le Plugin externe
`@zalo-platforms/openclaw-zaloclawbot` répertorié dans le catalogue. La connexion utilise un code QR
de Zalo Mini App.

## Compatibilité

| Version du Plugin | Version d’OpenClaw | npm dist-tag | Statut        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Actif / Bêta |

## Prérequis

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) doit être installé (CLI `openclaw` disponible).
- Un compte Zalo sur un appareil mobile pour scanner le code QR de connexion.

## Installer avec onboard (recommandé)

Exécutez l’assistant d’intégration OpenClaw et choisissez **Zalo ClawBot** dans le menu des canaux :

```bash
openclaw onboard
```

L’assistant installe le Plugin depuis le catalogue officiel (avec vérification d’intégrité), affiche le QR de connexion directement dans le terminal et termine la configuration du canal une fois que vous l’avez scanné avec l’application Zalo. Aucune commande supplémentaire n’est nécessaire.

## Installation manuelle

Pour ajouter le canal à un Gateway déjà intégré, suivez ces étapes :

### 1. Installer le Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Utilisez la version exacte épinglée ci-dessus (elle correspond à l’entrée du catalogue officiel), afin qu’OpenClaw vérifie le paquet par rapport au hachage d’intégrité du catalogue pendant l’installation.

### 2. Activer le Plugin dans la configuration

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Générer le code QR et se connecter

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scannez le code QR affiché dans le terminal avec l’application mobile Zalo, acceptez les Conditions d’utilisation dans la Zalo Mini App, puis autorisez la session.

### 4. Redémarrer le Gateway

```bash
openclaw gateway restart
```

---

## Fonctionnement

Contrairement au canal développeur Zalo standard, qui vous oblige à enregistrer votre propre Zalo Official Account (OA) et à coller des identifiants développeur statiques, Zalo ClawBot fonctionne comme un **assistant personnel lié au propriétaire** en utilisant une infrastructure officielle partagée :

1. **Intégration sécurisée :** Le code QR renvoie vers une Zalo Mini App sécurisée qui associe un bot privé nouvellement provisionné, sous une OA officielle partagée, directement à votre Zalo User ID.
2. **Confidentialité liée au propriétaire :** Par conception, le bot est limité à la communication _uniquement_ avec son propriétaire. Les messages d’autres utilisateurs sont rejetés au niveau de la plateforme, ce qui rend la connexion privée et sécurisée.
3. **Chemin d’API officiel :** Le Plugin utilise les API Zalo Bot Platform au lieu d’une automatisation
   de navigateur ou de session Web.

## Détails techniques

Le Plugin Zalo ClawBot communique avec les API Zalo via une boucle de messages persistante en long polling. Pour maintenir un runtime propre et léger :

- Les connexions en long polling utilisent le point de terminaison `getUpdates`.
- Les Webhooks sont désactivés par défaut pour les exécutions locales du Gateway depuis le bureau ou le terminal.
- Les messages sont traités côté client et mappés directement à votre runtime d’agent local.

Le Plugin externe gère les identifiants du bot dans le répertoire d’état d’OpenClaw.
Traitez ce répertoire comme sensible et incluez-le dans la même stratégie de contrôle d’accès et
de sauvegarde que le reste de votre état OpenClaw.

---

## Dépannage

- **Expiration de la connexion QR :** Le jeton de connexion (`zbsk`) expire après 5 minutes pour des raisons de sécurité. Si le code QR expire avant que vous ne le scanniez, relancez simplement la commande de connexion pour en générer un nouveau.
- **Échec du chargement du Gateway :** Assurez-vous que la version de votre hôte OpenClaw est `2026.4.10` ou supérieure. Les versions plus anciennes ne prennent pas en charge le registre d’installation des Plugins npm externes.
