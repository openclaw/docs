---
read_when:
    - Vous souhaitez une liste complète de ce qu’OpenClaw prend en charge
summary: Fonctionnalités d’OpenClaw pour les canaux, le routage, les médias et l’UX.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-05-06T07:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, et plus encore avec un seul Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins inclus ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, et plus encore sans installations séparées dans les versions actuelles normales.
  </Card>
  <Card title="Routage" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Médias" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, et génération d’images/vidéos.
  </Card>
  <Card title="Applications et UI" icon="monitor" href="/fr/web/control-ui">
    UI de contrôle Web et application compagnon macOS.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix/chat et commandes d’appareil enrichies.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage (hérité), IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de plugins inclus incluent BlueBubbles pour iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canal facultatifs installés séparément incluent Voice Call et des packages tiers tels que WeChat
- Les plugins de canal tiers peuvent étendre davantage le Gateway, par exemple WeChat
- Prise en charge des discussions de groupe avec activation basée sur les mentions
- Sécurité des MP avec listes d’autorisation et appairage

**Agent :**

- Environnement d’exécution d’agent intégré avec streaming d’outils
- Routage multi-agent avec sessions isolées par espace de travail ou expéditeur
- Sessions : les discussions directes sont regroupées dans `main` partagé ; les groupes sont isolés
- Streaming et segmentation pour les réponses longues

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google, et plus encore)
- Authentification par abonnement via OAuth (par exemple OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, et tout point de terminaison compatible OpenAI ou compatible Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée comme en sortie
- Surfaces de capacité partagées pour la génération d’images et la génération de vidéos
- Transcription des notes vocales
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et UI de contrôle dans le navigateur
- Application compagnon dans la barre de menus macOS
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes d’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exec, sandboxing
- Recherche Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, plugins et pipelines de workflow (Lobster)

## Associés

<CardGroup cols={2}>
  <Card title="Fonctionnalités expérimentales" href="/fr/concepts/experimental-features" icon="flask">
    Fonctionnalités opt-in qui n’ont pas encore été livrées à la surface par défaut.
  </Card>
  <Card title="Environnement d’exécution de l’agent" href="/fr/concepts/agent" icon="robot">
    Modèle d’environnement d’exécution de l’agent et mode de répartition des exécutions.
  </Card>
  <Card title="Canaux" href="/fr/channels" icon="message-square">
    Connectez Telegram, WhatsApp, Discord, Slack, et plus encore depuis un seul Gateway.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Plugins inclus et tiers qui étendent OpenClaw.
  </Card>
</CardGroup>
