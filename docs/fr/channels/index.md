---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-04-30T07:12:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de livraison

- Les réponses Telegram qui contiennent une syntaxe d’image Markdown, comme `![alt](url)`,
  sont converties en réponses média sur le chemin sortant final lorsque c’est possible.
- Les DM multi-personnes Slack sont acheminés comme des discussions de groupe ; la politique de groupe, le comportement des mentions
  et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration de WhatsApp s’installe à la demande : l’onboarding peut afficher le flux de configuration avant
  que les dépendances d’exécution Baileys soient préparées, et le Gateway charge le runtime WhatsApp
  uniquement lorsque le canal est effectivement actif.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec une prise en charge complète des fonctionnalités (plugin intégré ; modification, annulation d’envoi, effets, réactions, gestion des groupes — la modification est actuellement cassée sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) — API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les DM.
- [Feishu](/fr/channels/feishu) — bot Feishu/Lark via WebSocket (plugin intégré).
- [Google Chat](/fr/channels/googlechat) — application Google Chat API via webhook HTTP.
- [iMessage (legacy)](/fr/channels/imessage) — intégration macOS héritée via la CLI imsg (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) — serveurs IRC classiques ; canaux + DM avec contrôles d’appairage et de liste d’autorisation.
- [LINE](/fr/channels/line) — bot LINE Messaging API (plugin intégré).
- [Matrix](/fr/channels/matrix) — protocole Matrix (plugin intégré).
- [Mattermost](/fr/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, DM (plugin intégré).
- [Microsoft Teams](/fr/channels/msteams) — Bot Framework ; prise en charge entreprise (plugin intégré).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) — chat auto-hébergé via Nextcloud Talk (plugin intégré).
- [Nostr](/fr/channels/nostr) — DM décentralisés via NIP-04 (plugin intégré).
- [QQ Bot](/fr/channels/qqbot) — API QQ Bot ; chat privé, chat de groupe et médias enrichis (plugin intégré).
- [Signal](/fr/channels/signal) — signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) — Bolt SDK ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) — Synology NAS Chat via webhooks sortants+entrants (plugin intégré).
- [Telegram](/fr/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) — messagerie basée sur Urbit (plugin intégré).
- [Twitch](/fr/channels/twitch) — chat Twitch via connexion IRC (plugin intégré).
- [Voice Call](/fr/plugins/voice-call) — téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/fr/web/webchat) — interface WebChat du Gateway via WebSocket.
- [WeChat](/fr/channels/wechat) — plugin Tencent iLink Bot via connexion QR ; chats privés uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) — le plus populaire ; utilise Baileys et nécessite un appairage QR.
- [Yuanbao](/fr/channels/yuanbao) — bot Tencent Yuanbao (plugin externe).
- [Zalo](/fr/channels/zalo) — API Zalo Bot ; messagerie populaire au Vietnam (plugin intégré).
- [Zalo Personal](/fr/channels/zalouser) — compte personnel Zalo via connexion QR (plugin intégré).

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw acheminera les messages par chat.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage QR et
  stocke davantage d’état sur le disque.
- Le comportement des groupes varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des DM et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
