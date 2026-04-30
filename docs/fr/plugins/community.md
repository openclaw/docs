---
read_when:
    - Vous voulez trouver des Plugins OpenClaw tiers
    - Vous souhaitez publier ou répertorier votre propre Plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourez-les, installez-les et soumettez le vôtre'
title: Plugins de la communauté
x-i18n:
    generated_at: "2026-04-30T07:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

Les plugins communautaires sont des packages tiers qui étendent OpenClaw avec de nouveaux
canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, généralement publiés sur [ClawHub](/fr/tools/clawhub), et installables
avec une seule commande. npm reste une solution de repli prise en charge pour les packages qui ne sont
pas encore passés à ClawHub.

ClawHub est la surface de découverte canonique pour les plugins communautaires. N’ouvrez pas
de PR uniquement pour la documentation juste pour ajouter votre plugin ici afin qu’il soit découvrable ; publiez-le plutôt sur
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw vérifie d’abord ClawHub et se rabat automatiquement sur npm.

## Plugins répertoriés

### Apify

Récupérez des données depuis n’importe quel site web avec plus de 20 000 scrapers prêts à l’emploi. Laissez votre agent
extraire des données depuis Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, des sites d’e-commerce, et plus encore — simplement en le demandant.

- **npm :** `@apify/apify-openclaw-plugin`
- **dépôt :** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indépendant pour les conversations Codex App Server. Associez une discussion à
un fil Codex, échangez avec lui en texte simple, et contrôlez-le avec des
commandes natives de discussion pour la reprise, la planification, la revue, la sélection de modèle, la Compaction, et plus encore.

- **npm :** `openclaw-codex-app-server`
- **dépôt :** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Intégration de robot d’entreprise utilisant le mode Stream. Prend en charge les messages texte, image et
fichier via n’importe quel client DingTalk.

- **npm :** `@largezhou/ddingtalk`
- **dépôt :** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gestion de contexte sans perte pour OpenClaw. Résumé de conversation basé sur un DAG
avec Compaction incrémentale — préserve toute la fidélité du contexte
tout en réduisant l’utilisation des tokens.

- **npm :** `@martian-engineering/lossless-claw`
- **dépôt :** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agent vers Opik. Surveillez le comportement de l’agent,
le coût, les tokens, les erreurs, et plus encore.

- **npm :** `@opik/opik-openclaw`
- **dépôt :** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Donnez à votre agent OpenClaw un avatar Live2D avec synchronisation labiale en temps réel, expressions
émotionnelles et synthèse vocale. Inclut des outils de création pour la génération d’assets par IA
et le déploiement en un clic sur le Prometheus Marketplace. Actuellement en alpha.

- **npm :** `@prometheusavatar/openclaw-plugin`
- **dépôt :** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les discussions privées, les
mentions de groupe, les messages de canal, et les médias enrichis, notamment la voix, les images, les vidéos
et les fichiers.

Les versions actuelles d’OpenClaw incluent QQ Bot. Utilisez la configuration incluse dans
[QQ Bot](/fr/channels/qqbot) pour les installations normales ; installez ce plugin externe uniquement
lorsque vous voulez intentionnellement le package autonome maintenu par Tencent.

- **npm :** `@tencent-connect/openclaw-qqbot`
- **dépôt :** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Propulsé par
des connexions persistantes WebSocket WeCom Bot, il prend en charge les messages directs et les discussions de groupe,
les réponses en streaming, la messagerie proactive, le traitement des images/fichiers, la mise en forme Markdown,
le contrôle d’accès intégré, et les compétences de document/réunion/messagerie.

- **npm :** `@wecom/wecom-openclaw-plugin`
- **dépôt :** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin de canal Yuanbao pour OpenClaw par l’équipe Tencent Yuanbao. Propulsé par
des connexions persistantes WebSocket, il prend en charge les messages directs et les discussions de groupe,
les réponses en streaming, la messagerie proactive, le traitement des images/fichiers/audio/vidéo,
la mise en forme Markdown, le contrôle d’accès intégré, et les menus de commandes slash.

- **npm :** `openclaw-plugin-yuanbao`
- **dépôt :** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Soumettre votre plugin

Nous accueillons les plugins communautaires utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez-le sur [ClawHub](/fr/tools/clawhub), sauf si vous avez spécifiquement besoin d’une distribution
    uniquement via npm.
    Consultez [Créer des plugins](/fr/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec une documentation de configuration et un outil de suivi
    des tickets.

  </Step>

  <Step title="Utiliser les PR de documentation uniquement pour les modifications des docs source">
    Vous n’avez pas besoin d’une PR de documentation juste pour rendre votre plugin découvrable. Publiez-le plutôt
    sur ClawHub.

    Ouvrez une PR de documentation uniquement lorsque les docs source d’OpenClaw nécessitent une modification réelle
    du contenu, comme corriger les consignes d’installation ou ajouter une documentation
    inter-dépôts qui appartient à l’ensemble principal de la documentation.

  </Step>
</Steps>

## Critères de qualité

| Exigence                   | Pourquoi                                      |
| -------------------------- | --------------------------------------------- |
| Publié sur ClawHub ou npm  | Les utilisateurs ont besoin que `openclaw plugins install` fonctionne |
| Dépôt GitHub public        | Revue du code source, suivi des tickets, transparence |
| Docs de configuration et d’utilisation | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active         | Mises à jour récentes ou traitement réactif des tickets |

Les wrappers à faible effort, la propriété floue ou les packages non maintenus peuvent être refusés.

## Connexe

- [Installer et configurer des plugins](/fr/tools/plugin) — comment installer n’importe quel plugin
- [Créer des plugins](/fr/plugins/building-plugins) — créez le vôtre
- [Manifeste Plugin](/fr/plugins/manifest) — schéma du manifeste
