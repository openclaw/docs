---
read_when:
    - Vous voulez une liste complète de ce que prend en charge OpenClaw
summary: Capacités d’OpenClaw sur les canaux, le routage, les médias et l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-06-27T17:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## Points forts

<Columns>
  <Card title="Channels" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, et plus encore avec un seul Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins groupés ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, et plus encore sans installations séparées dans les versions actuelles normales.
  </Card>
  <Card title="Routing" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Media" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, et génération d’images/vidéos.
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/fr/platforms">
    Windows Hub, Web Control UI, application macOS et nœuds mobiles.
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix/chat et commandes d’appareil enrichies.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de plugins groupés incluent Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canaux optionnels installés séparément incluent Voice Call et des paquets tiers tels que WeChat
- Les plugins de canaux tiers peuvent étendre davantage le Gateway, par exemple WeChat
- Prise en charge des discussions de groupe avec activation basée sur les mentions
- Sécurité des messages privés avec listes d’autorisation et appairage

**Agent :**

- Runtime d’agent intégré avec diffusion en continu des outils
- Routage multi-agent avec sessions isolées par espace de travail ou expéditeur
- Sessions : les conversations directes sont regroupées dans `main` ; les groupes sont isolés
- Diffusion en continu et découpage pour les réponses longues

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google, et plus encore)
- Authentification par abonnement via OAuth (par ex. OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, et tout point de terminaison compatible OpenAI ou compatible Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée comme en sortie
- Surfaces de capacité partagées pour la génération d’images et la génération de vidéos
- Transcription des notes vocales
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et UI de contrôle dans le navigateur
- Application compagnon de barre de menus macOS
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes d’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exécution, sandboxing
- Recherche web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, plugins et pipelines de workflow (Lobster)

## Associés

<CardGroup cols={2}>
  <Card title="Experimental features" href="/fr/concepts/experimental-features" icon="flask">
    Fonctionnalités opt-in qui n’ont pas encore été livrées sur la surface par défaut.
  </Card>
  <Card title="Agent runtime" href="/fr/concepts/agent" icon="robot">
    Modèle de runtime d’agent et manière dont les exécutions sont distribuées.
  </Card>
  <Card title="Channels" href="/fr/channels" icon="message-square">
    Connectez Telegram, WhatsApp, Discord, Slack, et plus encore depuis un seul Gateway.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Plugins groupés et tiers qui étendent OpenClaw.
  </Card>
</CardGroup>
