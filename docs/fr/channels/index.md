---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-05-10T19:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de livraison

- Les réponses Telegram qui contiennent une syntaxe d’image Markdown, telle que `![alt](url)`,
  sont converties en réponses multimédias sur le chemin sortant final lorsque c’est possible.
- Les DM Slack à plusieurs personnes sont acheminés comme des discussions de groupe ; la politique de groupe, le comportement des mentions
  et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration de WhatsApp s’installe à la demande : l’onboarding peut afficher le flux de configuration avant
  que le package Plugin soit installé, et le Gateway charge le runtime WhatsApp
  uniquement lorsque le canal est réellement actif.

## Canaux pris en charge

- [Discord](/fr/channels/discord) - API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les DM.
- [Feishu](/fr/channels/feishu) - Bot Feishu/Lark via WebSocket (Plugin groupé).
- [Google Chat](/fr/channels/googlechat) - Application Google Chat API via Webhook HTTP (Plugin téléchargeable).
- [iMessage](/fr/channels/imessage) - Intégration macOS native via le pont `imsg` sur un Mac connecté (ou wrapper SSH lorsque le Gateway s’exécute ailleurs), incluant des actions d’API privée pour les réponses, les tapbacks, les effets, les pièces jointes et la gestion des groupes. Recommandé pour les nouvelles configurations iMessage d’OpenClaw lorsque les autorisations de l’hôte et l’accès à Messages conviennent.
- [IRC](/fr/channels/irc) - Serveurs IRC classiques ; canaux + DM avec contrôles d’appairage/liste d’autorisation.
- [LINE](/fr/channels/line) - Bot LINE Messaging API (Plugin téléchargeable).
- [Matrix](/fr/channels/matrix) - Protocole Matrix (Plugin téléchargeable).
- [Mattermost](/fr/channels/mattermost) - API Bot + WebSocket ; canaux, groupes, DM (Plugin téléchargeable).
- [Microsoft Teams](/fr/channels/msteams) - Bot Framework ; prise en charge en entreprise (Plugin groupé).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) - Chat auto-hébergé via Nextcloud Talk (Plugin groupé).
- [Nostr](/fr/channels/nostr) - DM décentralisés via NIP-04 (Plugin groupé).
- [QQ Bot](/fr/channels/qqbot) - API QQ Bot ; chat privé, chat de groupe et médias enrichis (Plugin groupé).
- [Signal](/fr/channels/signal) - signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) - Bolt SDK ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) - Synology NAS Chat via Webhook sortants+entrants (Plugin groupé).
- [Telegram](/fr/channels/telegram) - API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) - Messagerie basée sur Urbit (Plugin groupé).
- [Twitch](/fr/channels/twitch) - Chat Twitch via connexion IRC (Plugin groupé).
- [Voice Call](/fr/plugins/voice-call) - Téléphonie via Plivo ou Twilio (Plugin, installé séparément).
- [WebChat](/fr/web/webchat) - Interface utilisateur WebChat du Gateway via WebSocket.
- [WeChat](/fr/channels/wechat) - Plugin Tencent iLink Bot via connexion par QR code ; chats privés uniquement (Plugin externe).
- [WhatsApp](/fr/channels/whatsapp) - Le plus populaire ; utilise Baileys et nécessite un appairage par QR code.
- [Yuanbao](/fr/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externe).
- [Zalo](/fr/channels/zalo) - API Zalo Bot ; messagerie populaire au Vietnam (Plugin groupé).
- [Zalo Personal](/fr/channels/zalouser) - Compte personnel Zalo via connexion par QR code (Plugin groupé).

## Notes

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw acheminera par chat.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage par QR code et
  stocke davantage d’état sur le disque.
- Le comportement de groupe varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des DM et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
