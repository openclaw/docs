---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-06-27T17:10:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de diffusion

- Les réponses Telegram qui contiennent une syntaxe d’image Markdown, comme `![alt](url)`,
  sont converties en réponses multimédias sur le chemin de sortie final lorsque c’est possible.
- Les MPIM Slack sont acheminés comme des discussions de groupe ; les règles de groupe, le comportement des
  mentions et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration WhatsApp s’installe à la demande : l’intégration peut afficher le flux de configuration avant
  que le package du Plugin soit installé, et le Gateway charge le Plugin externe
  ClawHub/npm uniquement lorsque le canal est réellement actif.
- Les canaux qui acceptent les messages entrants rédigés par un bot peuvent utiliser la
  [protection contre les boucles de bots](/fr/channels/bot-loop-protection) partagée pour empêcher des paires de bots de
  se répondre indéfiniment.
- Les salons toujours actifs pris en charge peuvent utiliser les [événements de salon ambiants](/fr/channels/ambient-room-events)
  afin que les échanges non mentionnés du salon deviennent un contexte discret, sauf si l’agent envoie avec
  l’outil `message`.

## Canaux pris en charge

- [Discord](/fr/channels/discord) - API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les messages privés.
- [Feishu](/fr/channels/feishu) - Bot Feishu/Lark via WebSocket (plugin groupé).
- [Google Chat](/fr/channels/googlechat) - Application Google Chat API via webhook HTTP (plugin téléchargeable).
- [iMessage](/fr/channels/imessage) - Intégration native macOS via le pont `imsg` sur un Mac connecté (ou enveloppe SSH lorsque le Gateway s’exécute ailleurs), avec actions d’API privée pour les réponses, tapbacks, effets, pièces jointes et gestion de groupes. Recommandé pour les nouvelles configurations iMessage OpenClaw lorsque les permissions de l’hôte et l’accès à Messages conviennent.
- [IRC](/fr/channels/irc) - Serveurs IRC classiques ; canaux + messages privés avec contrôles d’appairage/liste d’autorisation.
- [LINE](/fr/channels/line) - Bot LINE Messaging API (plugin téléchargeable).
- [Matrix](/fr/channels/matrix) - Protocole Matrix (plugin téléchargeable).
- [Mattermost](/fr/channels/mattermost) - API Bot + WebSocket ; canaux, groupes, messages privés (plugin téléchargeable).
- [Microsoft Teams](/fr/channels/msteams) - Bot Framework ; prise en charge entreprise (plugin groupé).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) - Chat auto-hébergé via Nextcloud Talk (plugin groupé).
- [Nostr](/fr/channels/nostr) - Messages privés décentralisés via NIP-04 (plugin groupé).
- [QQ Bot](/fr/channels/qqbot) - API QQ Bot ; discussion privée, discussion de groupe et médias enrichis (plugin groupé).
- [Raft](/fr/channels/raft) - Passerelle de réveil CLI Raft pour la collaboration humaine et agent (plugin externe).
- [Signal](/fr/channels/signal) - signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) - Bolt SDK ; applications d’espace de travail.
- [SMS](/fr/channels/sms) - SMS adossés à Twilio via le webhook du Gateway (plugin officiel).
- [Synology Chat](/fr/channels/synology-chat) - Synology NAS Chat via webhooks sortants+entrants (plugin groupé).
- [Telegram](/fr/channels/telegram) - API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) - Messagerie basée sur Urbit (plugin groupé).
- [Twitch](/fr/channels/twitch) - Chat Twitch via connexion IRC (plugin groupé).
- [Voice Call](/fr/plugins/voice-call) - Téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/fr/web/webchat) - Interface WebChat du Gateway via WebSocket.
- [WeChat](/fr/channels/wechat) - Plugin Tencent iLink Bot via connexion par QR code ; discussions privées uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) - Le plus populaire ; utilise Baileys et nécessite un appairage par QR code.
- [Yuanbao](/fr/channels/yuanbao) - Bot Tencent Yuanbao (plugin externe).
- [Zalo](/fr/channels/zalo) - API Zalo Bot ; messagerie populaire du Vietnam (plugin groupé).
- [Zalo ClawBot](/fr/channels/zaloclawbot) - Assistant Zalo personnel via connexion par QR code ; lié au propriétaire (plugin externe).
- [Zalo Personal](/fr/channels/zalouser) - Compte personnel Zalo via connexion par QR code (plugin groupé).

## Notes

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw acheminera par chat.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage par QR code et
  stocke davantage d’état sur le disque.
- Le comportement de groupe varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des messages privés et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
