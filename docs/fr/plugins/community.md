---
read_when:
    - Vous voulez trouver des Plugins OpenClaw tiers
    - Vous voulez publier ou référencer votre propre Plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourir, installer et proposer le vôtre'
title: Plugins communautaires
x-i18n:
    generated_at: "2026-04-26T11:34:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Les Plugins communautaires sont des packages tiers qui étendent OpenClaw avec de nouveaux
canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, publiés sur [ClawHub](/fr/tools/clawhub) ou npm, et
installables avec une seule commande.

ClawHub est la surface de découverte canonique pour les Plugins communautaires. N’ouvrez pas
de PR uniquement documentaire juste pour ajouter ici votre Plugin à des fins de découvrabilité ; publiez-le plutôt sur
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw vérifie d’abord ClawHub puis revient automatiquement à npm.

## Plugins référencés

### Apify

Scrapez des données depuis n’importe quel site web avec plus de 20 000 scrapers prêts à l’emploi. Laissez votre agent
extraire des données depuis Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, des sites e-commerce et plus encore — simplement en le demandant.

- **npm :** `@apify/apify-openclaw-plugin`
- **dépôt :** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Pont OpenClaw indépendant pour les conversations Codex App Server. Lie un chat à
un fil Codex, discutez-y en texte brut et contrôlez-le avec des commandes natives au chat pour la
reprise, la planification, la revue, la sélection de modèle, la Compaction, etc.

- **npm :** `openclaw-codex-app-server`
- **dépôt :** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Intégration de robot d’entreprise utilisant le mode Stream. Prend en charge le texte, les images et
les messages de fichier via n’importe quel client DingTalk.

- **npm :** `@largezhou/ddingtalk`
- **dépôt :** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gestion de contexte sans perte pour OpenClaw. Résumé de conversation
basé sur DAG avec Compaction incrémentale — préserve toute la fidélité du contexte
tout en réduisant l’usage de jetons.

- **npm :** `@martian-engineering/lossless-claw`
- **dépôt :** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agent vers Opik. Surveillez le comportement de l’agent,
les coûts, les jetons, les erreurs, etc.

- **npm :** `@opik/opik-openclaw`
- **dépôt :** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Donnez à votre agent OpenClaw un avatar Live2D avec synchronisation labiale en temps réel, expressions
émotionnelles et synthèse vocale. Inclut des outils de création pour la génération d’assets IA
et un déploiement en un clic sur la Prometheus Marketplace. Actuellement en alpha.

- **npm :** `@prometheusavatar/openclaw-plugin`
- **dépôt :** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les chats privés, les
mentions de groupe, les messages de canal et les médias enrichis, y compris la voix, les images, les vidéos
et les fichiers.

Les versions actuelles d’OpenClaw intègrent QQ Bot. Utilisez la configuration intégrée dans
[QQ Bot](/fr/channels/qqbot) pour les installations normales ; installez ce Plugin externe uniquement
si vous voulez volontairement le package autonome maintenu par Tencent.

- **npm :** `@tencent-connect/openclaw-qqbot`
- **dépôt :** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Alimenté par
des connexions persistantes WebSocket WeCom Bot, il prend en charge les messages directs et
les chats de groupe, les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers, le formatage Markdown,
le contrôle d’accès intégré et les Skills de documents/réunions/messagerie.

- **npm :** `@wecom/wecom-openclaw-plugin`
- **dépôt :** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Proposer votre Plugin

Nous accueillons volontiers les Plugins communautaires utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre Plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez-le sur [ClawHub](/fr/tools/clawhub) (préféré) ou npm.
    Voir [Building Plugins](/fr/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec une documentation d’installation et un
    système de suivi des issues.

  </Step>

  <Step title="N’utiliser les PR docs que pour des changements de docs source">
    Vous n’avez pas besoin d’une PR de documentation juste pour rendre votre Plugin découvrable. Publiez-le
    plutôt sur ClawHub.

    Ouvrez une PR docs uniquement lorsque les docs source d’OpenClaw nécessitent un véritable
    changement de contenu, par exemple pour corriger des consignes d’installation ou ajouter une
    documentation inter-dépôts qui appartient au jeu principal de documentation.

  </Step>
</Steps>

## Niveau de qualité attendu

| Exigence                    | Pourquoi                                         |
| --------------------------- | ------------------------------------------------ |
| Publié sur ClawHub ou npm   | Les utilisateurs ont besoin que `openclaw plugins install` fonctionne |
| Dépôt GitHub public         | Revue du code, suivi des issues, transparence    |
| Documentation d’installation et d’utilisation | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active          | Mises à jour récentes ou gestion réactive des issues |

Les wrappers à faible effort, la propriété peu claire ou les packages non maintenus peuvent être refusés.

## Associé

- [Install and Configure Plugins](/fr/tools/plugin) — comment installer n’importe quel Plugin
- [Building Plugins](/fr/plugins/building-plugins) — créer le vôtre
- [Plugin Manifest](/fr/plugins/manifest) — schéma de manifeste
