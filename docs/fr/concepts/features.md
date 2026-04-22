---
read_when:
    - Vous souhaitez obtenir une liste complète de ce que prend en charge OpenClaw
summary: Capacités d’OpenClaw sur l’ensemble des canaux, du routage, des médias et de l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-04-22T04:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Fonctionnalités

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, et plus encore avec une seule Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins inclus ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, et plus encore sans installation séparée dans les versions actuelles normales.
  </Card>
  <Card title="Routage" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Médias" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, et génération d’images/vidéos.
  </Card>
  <Card title="Apps et UI" icon="monitor" href="/web/control-ui">
    Interface Web Control UI et app compagnon macOS.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix/chat, et commandes avancées de l’appareil.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage (hérité), IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de Plugin inclus comprennent BlueBubbles pour iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canal optionnels installés séparément incluent Voice Call et des packages tiers comme WeChat
- Les plugins de canal tiers peuvent étendre davantage la Gateway, comme WeChat
- Prise en charge des discussions de groupe avec activation basée sur les mentions
- Sécurité des messages directs avec listes d’autorisation et appairage

**Agent :**

- Runtime d’agent intégré avec streaming d’outils
- Routage multi-agent avec sessions isolées par espace de travail ou expéditeur
- Sessions : les discussions directes sont regroupées dans `main` ; les groupes sont isolés
- Streaming et découpage pour les réponses longues

**Authentification et providers :**

- Plus de 35 providers de modèles (Anthropic, OpenAI, Google, et plus encore)
- Authentification par abonnement via OAuth (par exemple OpenAI Codex)
- Prise en charge des providers personnalisés et auto-hébergés (vLLM, SGLang, Ollama, et tout point de terminaison compatible OpenAI ou compatible Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée et en sortie
- Surfaces de capacités partagées pour la génération d’images et la génération vidéo
- Transcription de notes vocales
- Synthèse vocale avec plusieurs providers

**Apps et interfaces :**

- WebChat et interface navigateur Control UI
- App compagnon macOS dans la barre de menus
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes de l’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exec, sandboxing
- Recherche Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, plugins et pipelines de workflow (Lobster)
