---
read_when:
    - Vous souhaitez obtenir la liste complète des fonctionnalités prises en charge par OpenClaw
summary: Fonctionnalités d’OpenClaw pour les canaux, le routage, les médias et l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-07-12T02:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat et bien plus encore avec un seul Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins officiels ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo et des dizaines d’autres services avec une seule commande d’installation.
  </Card>
  <Card title="Routage" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec des sessions isolées.
  </Card>
  <Card title="Médias" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, ainsi que génération d’images et de vidéos.
  </Card>
  <Card title="Applications et interface utilisateur" icon="monitor" href="/fr/platforms">
    Hub Windows, interface de contrôle dans le navigateur, application de barre des menus macOS et nœuds mobiles.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix et chat, ainsi que des commandes avancées pour les appareils.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- iMessage, Telegram et WebChat sont inclus dans l’installation principale ; tous les autres canaux sont des
  plugins officiels installés avec `openclaw plugins install @openclaw/<id>` (ou à la demande
  pendant `openclaw onboard` / `openclaw channels add`)
- Canaux proposés sous forme de plugins officiels : Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo et Zalo Personal
- Canaux proposés sous forme de plugins externes maintenus hors du dépôt OpenClaw : WeChat, Yuanbao et Zalo ClawBot
- Prise en charge des discussions de groupe avec activation par mention
- Sécurisation des messages privés par listes d’autorisation et appairage

**Agent :**

- Environnement d’exécution d’agent intégré avec diffusion en continu des outils
- Routage multi-agent avec des sessions isolées par espace de travail ou expéditeur
- Sessions : les conversations directes sont regroupées dans la session partagée `main` ; les groupes sont isolés
- Diffusion en continu et découpage des réponses longues

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google et bien d’autres)
- Authentification par abonnement via OAuth (par exemple OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, llama.cpp, LM Studio et
  tout point de terminaison compatible avec OpenAI ou Anthropic)

**Médias :**

- Entrée et sortie d’images, de contenus audio et vidéo, ainsi que de documents
- Interfaces de capacités partagées pour la génération d’images et de vidéos
- Transcription des messages vocaux
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et interface de contrôle dans le navigateur
- Application compagnon dans la barre des menus de macOS
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes d’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exécution de commandes et mise en bac à sable
- Recherche sur le Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification des Heartbeat
- Skills, plugins et pipelines de flux de travail (Lobster)

## Voir aussi

<CardGroup cols={2}>
  <Card title="Fonctionnalités expérimentales" href="/fr/concepts/experimental-features" icon="flask">
    Fonctionnalités facultatives qui ne sont pas encore proposées dans l’interface par défaut.
  </Card>
  <Card title="Environnement d’exécution de l’agent" href="/fr/concepts/agent" icon="robot">
    Modèle d’exécution de l’agent et méthode de répartition des exécutions.
  </Card>
  <Card title="Canaux" href="/fr/channels" icon="message-square">
    Connectez Telegram, WhatsApp, Discord, Slack et bien d’autres services depuis un seul Gateway.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Plugins officiels et externes qui étendent OpenClaw.
  </Card>
</CardGroup>
