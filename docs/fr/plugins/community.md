---
read_when:
    - Vous souhaitez trouver des Plugins OpenClaw tiers
    - Vous souhaitez publier ou répertorier votre propre Plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourez, installez et soumettez les vôtres'
title: Plugins communautaires
x-i18n:
    generated_at: "2026-05-11T20:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Les plugins communautaires sont des packages tiers qui étendent OpenClaw avec de nouveaux
canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, généralement publiés sur [ClawHub](/fr/clawhub), et installables
avec une seule commande. Npm reste la valeur par défaut de lancement pour les spécifications de packages simples
pendant le déploiement des installations de packs ClawHub.

ClawHub est la surface de découverte canonique pour les plugins communautaires. N’ouvrez pas
de PR uniquement dédiées aux docs simplement pour ajouter votre plugin ici à des fins de découverte ; publiez-le plutôt sur
ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Utilisez `openclaw plugins install <package-name>` pour les packages hébergés sur npm.

## Plugins répertoriés

### Apify

Extrayez des données de n’importe quel site web avec plus de 20 000 scrapers prêts à l’emploi. Laissez votre agent
extraire des données d’Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, de sites d’e-commerce et plus encore — simplement en le demandant.

- **npm :** `@apify/apify-openclaw-plugin`
- **dépôt :** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Passerelle OpenClaw indépendante pour les conversations Codex App Server. Associez un chat à
un fil Codex, échangez avec lui en texte brut, et contrôlez-le avec des commandes
natives au chat pour la reprise, la planification, la revue, la sélection du modèle, la compaction, et plus encore.

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

Plugin Lossless Context Management pour OpenClaw. Résumé de conversation basé sur un DAG
avec compaction incrémentale — préserve toute la fidélité du contexte
tout en réduisant l’utilisation des tokens.

- **npm :** `@martian-engineering/lossless-claw`
- **dépôt :** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agents vers Opik. Surveillez le comportement des agents,
les coûts, les tokens, les erreurs, et plus encore.

- **npm :** `@opik/opik-openclaw`
- **dépôt :** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Donnez à votre agent OpenClaw un avatar Live2D avec synchronisation labiale en temps réel, expressions
d’émotion et synthèse vocale. Inclut des outils de création pour la génération d’assets par IA
et le déploiement en un clic vers la Prometheus Marketplace. Actuellement en alpha.

- **npm :** `@prometheusavatar/openclaw-plugin`
- **dépôt :** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les chats privés, les mentions
de groupe, les messages de canal et les médias riches, notamment la voix, les images, les vidéos
et les fichiers.

Les versions actuelles d’OpenClaw incluent QQ Bot. Utilisez la configuration intégrée dans
[QQ Bot](/fr/channels/qqbot) pour les installations normales ; installez ce plugin externe uniquement
lorsque vous souhaitez intentionnellement le package autonome maintenu par Tencent.

- **npm :** `@tencent-connect/openclaw-qqbot`
- **dépôt :** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Basé sur des connexions
persistantes WeCom Bot WebSocket, il prend en charge les messages directs et les chats de groupe,
les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers, le formatage Markdown,
le contrôle d’accès intégré et les skills de document/réunion/messagerie.

- **npm :** `@wecom/wecom-openclaw-plugin`
- **dépôt :** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin de canal Yuanbao pour OpenClaw par l’équipe Tencent Yuanbao. Basé sur des connexions
persistantes WebSocket, il prend en charge les messages directs et les chats de groupe,
les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers/audio/vidéo,
le formatage Markdown, le contrôle d’accès intégré et les menus de commandes slash.

- **npm :** `openclaw-plugin-yuanbao`
- **dépôt :** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Soumettre votre plugin

Nous accueillons les plugins communautaires utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez sur [ClawHub](/fr/clawhub), sauf si vous avez spécifiquement besoin d’une distribution
    uniquement via npm.
    Consultez [Créer des Plugins](/fr/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec des docs de configuration et un outil de suivi
    des issues.

  </Step>

  <Step title="Utiliser les PR de docs uniquement pour les modifications de docs source">
    Vous n’avez pas besoin d’une PR de docs simplement pour rendre votre plugin découvrable. Publiez-le
    plutôt sur ClawHub.

    Ouvrez une PR de docs uniquement lorsque les docs source d’OpenClaw nécessitent une véritable modification
    de contenu, par exemple pour corriger les consignes d’installation ou ajouter une documentation
    inter-dépôts qui appartient à l’ensemble principal des docs.

  </Step>
</Steps>

## Critères de qualité

| Exigence                    | Pourquoi                                      |
| --------------------------- | --------------------------------------------- |
| Publié sur ClawHub ou npm   | Les utilisateurs ont besoin que `openclaw plugins install` fonctionne |
| Dépôt GitHub public         | Revue du code source, suivi des issues, transparence |
| Docs de configuration et d’utilisation | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active          | Mises à jour récentes ou gestion réactive des issues |

Les wrappers à faible effort, dont la propriété est peu claire ou les packages non maintenus peuvent être refusés.

## Liens associés

- [Installer et configurer des Plugins](/fr/tools/plugin) — comment installer n’importe quel plugin
- [Créer des Plugins](/fr/plugins/building-plugins) — créez le vôtre
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma du manifeste
