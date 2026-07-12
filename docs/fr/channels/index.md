---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-07-12T02:36:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut communiquer avec vous sur n’importe quelle application de messagerie que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

iMessage, Telegram et l’interface WebChat sont fournis avec l’installation principale. Les canaux marqués
« plugin officiel » s’installent à l’aide d’une seule commande (`openclaw plugins install @openclaw/<id>`)
ou à la demande pendant `openclaw onboard` / `openclaw channels add`, puis nécessitent un redémarrage du Gateway.
Les canaux marqués « plugin externe » sont maintenus en dehors du dépôt OpenClaw.

## Canaux pris en charge

- [Discord](/fr/channels/discord) - API de bot Discord + Gateway ; prend en charge les serveurs, les canaux et les messages privés (plugin officiel).
- [Feishu](/fr/channels/feishu) - Bot Feishu/Lark via WebSocket (plugin officiel).
- [Google Chat](/fr/channels/googlechat) - Application Google Chat API via un Webhook HTTP (plugin officiel).
- [iMessage](/fr/channels/imessage) - Inclus dans le cœur. Intégration native à macOS via le pont `imsg` sur un Mac connecté (ou une enveloppe SSH lorsque le Gateway s’exécute ailleurs), notamment avec des actions d’API privée pour les réponses, les réactions Tapback, les effets, les pièces jointes et la gestion des groupes.
- [IRC](/fr/channels/irc) - Serveurs IRC classiques ; canaux et messages privés avec contrôles d’association et de liste d’autorisation (plugin officiel).
- [LINE](/fr/channels/line) - Bot LINE Messaging API (plugin officiel).
- [Matrix](/fr/channels/matrix) - Protocole Matrix (plugin officiel).
- [Mattermost](/fr/channels/mattermost) - API de bot + WebSocket ; canaux, groupes et messages privés (plugin officiel).
- [Microsoft Teams](/fr/channels/msteams) - Bot Framework ; prise en charge en entreprise (plugin officiel).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) - Messagerie auto-hébergée via Nextcloud Talk (plugin officiel).
- [Nostr](/fr/channels/nostr) - Messages privés décentralisés via NIP-04 (plugin officiel).
- [QQ Bot](/fr/channels/qqbot) - API QQ Bot ; conversations privées, conversations de groupe et contenus multimédias enrichis (plugin officiel).
- [Raft](/fr/channels/raft) - Pont d’activation de la CLI Raft pour la collaboration entre humains et agents (plugin officiel).
- [Signal](/fr/channels/signal) - signal-cli ; axé sur la confidentialité (plugin officiel).
- [Slack](/fr/channels/slack) - SDK Bolt ; applications d’espace de travail (plugin officiel).
- [SMS](/fr/channels/sms) - SMS reposant sur Twilio via le Webhook du Gateway (plugin officiel).
- [Synology Chat](/fr/channels/synology-chat) - Synology NAS Chat via des webhooks sortants et entrants (plugin officiel).
- [Telegram](/fr/channels/telegram) - Inclus dans le cœur. API de bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) - Messagerie reposant sur Urbit (plugin officiel).
- [Twitch](/fr/channels/twitch) - Messagerie Twitch via une connexion IRC (plugin officiel).
- [Appel vocal](/fr/plugins/voice-call) - Téléphonie via Plivo, Telnyx ou Twilio (plugin officiel).
- [WebChat](/fr/web/webchat) - Inclus dans le cœur. Interface WebChat du Gateway via WebSocket.
- [WeChat](/fr/channels/wechat) - Bot Tencent iLink avec connexion par code QR ; conversations privées uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) - Le plus populaire ; utilise Baileys et nécessite une association par code QR (plugin officiel).
- [Yuanbao](/fr/channels/yuanbao) - Bot Tencent Yuanbao (plugin externe).
- [Zalo](/fr/channels/zalo) - API Zalo Bot ; messagerie populaire au Vietnam (plugin officiel).
- [Zalo ClawBot](/fr/channels/zaloclawbot) - Assistant Zalo personnel avec connexion par code QR ; lié au propriétaire (plugin externe).
- [Zalo Personal](/fr/channels/zalouser) - Compte Zalo personnel avec connexion par code QR (plugin officiel).

## Remarques sur la distribution

- Les réponses Telegram contenant une syntaxe d’image Markdown, telle que `![alt](url)`,
  sont converties en réponses multimédias sur le chemin de sortie final lorsque cela est possible.
- Les messages privés Slack à plusieurs participants sont acheminés comme des conversations de groupe ; la politique de groupe, le comportement des mentions
  et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration de WhatsApp s’effectue par installation à la demande : l’intégration peut afficher le processus de configuration avant
  l’installation du paquet du plugin, et le Gateway ne charge le plugin externe
  ClawHub/npm que lorsque le canal est réellement actif.
- Les canaux qui acceptent les messages entrants rédigés par des bots peuvent utiliser la
  [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection) afin d’empêcher des paires de bots
  de se répondre indéfiniment.
- Les salons permanents pris en charge peuvent utiliser les [événements ambiants de salon](/fr/channels/ambient-room-events)
  afin que les échanges du salon ne mentionnant pas l’agent deviennent un contexte discret, sauf si l’agent envoie un message avec
  l’outil `message`.

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw effectuera l’acheminement pour chaque conversation.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot, aucune installation de plugin). WhatsApp
  nécessite une association par code QR et stocke davantage d’état sur le disque.
- Le comportement des groupes varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’association des messages privés et les listes d’autorisation sont appliquées pour des raisons de sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
