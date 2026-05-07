---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de livraison

- Les réponses Telegram contenant une syntaxe d’image Markdown, comme `![alt](url)`,
  sont converties en réponses média sur le chemin sortant final lorsque c’est possible.
- Les MPIM Slack sont routés comme des discussions de groupe ; la politique de groupe, le
  comportement des mentions et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration WhatsApp s’installe à la demande : l’onboarding peut afficher le flux de configuration avant
  l’installation du package du plugin, et le Gateway charge le runtime WhatsApp
  uniquement lorsque le canal est réellement actif.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) - Pont iMessage hérité via l’API REST du serveur macOS BlueBubbles ; déconseillé pour les nouvelles configurations OpenClaw, mais toujours pris en charge pour les configurations existantes et les actions d’API privée plus riches.
- [Discord](/fr/channels/discord) - API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les MP.
- [Feishu](/fr/channels/feishu) - Bot Feishu/Lark via WebSocket (plugin groupé).
- [Google Chat](/fr/channels/googlechat) - Application d’API Google Chat via Webhook HTTP (plugin téléchargeable).
- [iMessage](/fr/channels/imessage) - Intégration macOS native via la CLI imsg ; recommandée pour les nouvelles configurations iMessage OpenClaw lorsque les autorisations de l’hôte et l’accès à Messages conviennent.
- [IRC](/fr/channels/irc) - Serveurs IRC classiques ; canaux + MP avec contrôles d’appairage et de liste d’autorisation.
- [LINE](/fr/channels/line) - Bot LINE Messaging API (plugin téléchargeable).
- [Matrix](/fr/channels/matrix) - Protocole Matrix (plugin téléchargeable).
- [Mattermost](/fr/channels/mattermost) - API Bot + WebSocket ; canaux, groupes, MP (plugin téléchargeable).
- [Microsoft Teams](/fr/channels/msteams) - Bot Framework ; prise en charge en entreprise (plugin groupé).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) - Chat auto-hébergé via Nextcloud Talk (plugin groupé).
- [Nostr](/fr/channels/nostr) - MP décentralisés via NIP-04 (plugin groupé).
- [QQ Bot](/fr/channels/qqbot) - API QQ Bot ; chat privé, chat de groupe et médias riches (plugin groupé).
- [Signal](/fr/channels/signal) - signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) - SDK Bolt ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) - Synology NAS Chat via webhooks sortants+entrants (plugin groupé).
- [Telegram](/fr/channels/telegram) - API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) - Messagerie basée sur Urbit (plugin groupé).
- [Twitch](/fr/channels/twitch) - Chat Twitch via connexion IRC (plugin groupé).
- [Voice Call](/fr/plugins/voice-call) - Téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/fr/web/webchat) - Interface WebChat du Gateway sur WebSocket.
- [WeChat](/fr/channels/wechat) - Plugin Tencent iLink Bot via connexion par QR code ; chats privés uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) - Le plus populaire ; utilise Baileys et nécessite un appairage par QR code.
- [Yuanbao](/fr/channels/yuanbao) - Bot Tencent Yuanbao (plugin externe).
- [Zalo](/fr/channels/zalo) - API Zalo Bot ; messagerie populaire au Vietnam (plugin groupé).
- [Zalo Personal](/fr/channels/zalouser) - Compte personnel Zalo via connexion par QR code (plugin groupé).

## Notes

- Les canaux peuvent s’exécuter simultanément ; configurez-en plusieurs et OpenClaw routera chaque chat.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage par QR code et
  stocke davantage d’état sur le disque.
- Le comportement de groupe varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des MP et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
