---
read_when:
    - Vous voulez obtenir la liste complète de ce qu’OpenClaw prend en charge
summary: Fonctionnalités d’OpenClaw couvrant les canaux, le routage, les médias et l’UX.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-05-11T20:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat et plus encore avec un seul Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins intégrés ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo et plus encore sans installations séparées dans les versions actuelles normales.
  </Card>
  <Card title="Routage" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Médias" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, et génération d’images/vidéos.
  </Card>
  <Card title="Applications et UI" icon="monitor" href="/fr/web/control-ui">
    UI de contrôle web et application compagnon macOS.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix/chat, et commandes riches de l’appareil.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de plugins intégrés incluent Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canaux facultatifs installés séparément incluent Voice Call et des packages tiers comme WeChat
- Les plugins de canaux tiers peuvent étendre davantage le Gateway, comme WeChat
- Prise en charge des discussions de groupe avec activation basée sur les mentions
- Sécurité des messages privés avec listes d’autorisation et appairage

**Agent :**

- Runtime d’agent intégré avec diffusion en continu des outils
- Routage multi-agent avec sessions isolées par espace de travail ou expéditeur
- Sessions : les discussions directes se replient dans `main` partagé ; les groupes sont isolés
- Diffusion en continu et segmentation pour les longues réponses

**Auth et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google et plus encore)
- Auth d’abonnement via OAuth (par ex. OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, et tout endpoint compatible OpenAI ou Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée et en sortie
- Surfaces de capacités partagées pour la génération d’images et de vidéos
- Transcription des notes vocales
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et UI de contrôle dans le navigateur
- Application compagnon dans la barre de menus macOS
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes de l’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exec, sandboxing
- Recherche web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, plugins et pipelines de workflow (Lobster)

## Connexe

<CardGroup cols={2}>
  <Card title="Fonctionnalités expérimentales" href="/fr/concepts/experimental-features" icon="flask">
    Fonctionnalités facultatives qui n’ont pas encore été livrées dans la surface par défaut.
  </Card>
  <Card title="Runtime d’agent" href="/fr/concepts/agent" icon="robot">
    Modèle du runtime d’agent et mode de répartition des exécutions.
  </Card>
  <Card title="Canaux" href="/fr/channels" icon="message-square">
    Connectez Telegram, WhatsApp, Discord, Slack et plus encore depuis un seul Gateway.
  </Card>
  <Card title="Plugins" href="/fr/tools/plugin" icon="plug">
    Plugins intégrés et tiers qui étendent OpenClaw.
  </Card>
</CardGroup>
