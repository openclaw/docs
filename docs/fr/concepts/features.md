---
read_when:
    - Vous voulez la liste complète de ce qu’OpenClaw prend en charge
summary: Fonctionnalités d’OpenClaw sur les canaux, le routage, les médias et l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-05-07T01:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f95185073e52f4b5b34042ea27927984bf0b040d20eb61b135514816fddc214
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
    Nœuds iOS et Android avec association, voix/chat, et commandes d’appareil enrichies.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, et WhatsApp
- Les canaux de Plugin inclus incluent BlueBubbles comme passerelle iMessage héritée, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, et Zalo Personal
- Les Plugins de canal facultatifs installés séparément incluent Voice Call et des packages tiers tels que WeChat
- Les Plugins de canal tiers peuvent étendre davantage le Gateway, par exemple WeChat
- Prise en charge des discussions de groupe avec activation par mention
- Sécurité des messages directs avec listes d’autorisation et association

**Agent :**

- Environnement d’exécution d’agent intégré avec streaming d’outils
- Routage multi-agent avec sessions isolées par espace de travail ou expéditeur
- Sessions : les discussions directes se replient dans `main` partagé ; les groupes sont isolés
- Streaming et segmentation pour les réponses longues

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google, et plus encore)
- Authentification par abonnement via OAuth (par ex. OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, et tout point de terminaison compatible OpenAI ou compatible Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée et en sortie
- Surfaces de capacité partagées pour la génération d’images et la génération de vidéos
- Transcription de notes vocales
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et UI de contrôle dans le navigateur
- Application compagnon de barre de menus macOS
- Nœud iOS avec association, Canvas, appareil photo, enregistrement d’écran, localisation et voix
- Nœud Android avec association, chat, voix, Canvas, appareil photo et commandes d’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exec, sandboxing
- Recherche Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, Plugins, et pipelines de workflow (Lobster)

## Associés

<CardGroup cols={2}>
  <Card title="Fonctionnalités expérimentales" href="/fr/concepts/experimental-features" icon="flask">
    Fonctionnalités opt-in qui n’ont pas encore été livrées sur la surface par défaut.
  </Card>
  <Card title="Environnement d’exécution de l’agent" href="/fr/concepts/agent" icon="robot">
    Modèle d’environnement d’exécution de l’agent et façon dont les exécutions sont dispatchées.
  </Card>
  <Card title="Canaux" href="/fr/channels" icon="message-square">
    Connectez Telegram, WhatsApp, Discord, Slack, et plus encore depuis un seul Gateway.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Plugins inclus et tiers qui étendent OpenClaw.
  </Card>
</CardGroup>
