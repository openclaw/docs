---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-05-02T06:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut communiquer avec vous sur n’importe quelle application de discussion que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de livraison

- Les réponses Telegram qui contiennent une syntaxe d’image Markdown, comme `![alt](url)`,
  sont converties en réponses média sur le chemin sortant final lorsque c’est possible.
- Les MPIM Slack sont acheminés comme des discussions de groupe ; la politique de groupe, le comportement
  des mentions et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration de WhatsApp s’installe à la demande : l’onboarding peut afficher le flux de configuration avant
  que le package du plugin soit installé, et le Gateway charge le runtime WhatsApp
  uniquement lorsque le canal est réellement actif.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec prise en charge complète des fonctionnalités (plugin groupé ; modification, annulation d’envoi, effets, réactions, gestion de groupe — la modification est actuellement cassée sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) — API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les MPIM.
- [Feishu](/fr/channels/feishu) — Bot Feishu/Lark via WebSocket (plugin groupé).
- [Google Chat](/fr/channels/googlechat) — Application Google Chat API via webhook HTTP (plugin téléchargeable).
- [iMessage (ancien)](/fr/channels/imessage) — Ancienne intégration macOS via la CLI imsg (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) — Serveurs IRC classiques ; canaux + MPIM avec contrôles d’appairage/liste d’autorisation.
- [LINE](/fr/channels/line) — Bot LINE Messaging API (plugin téléchargeable).
- [Matrix](/fr/channels/matrix) — Protocole Matrix (plugin téléchargeable).
- [Mattermost](/fr/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, MPIM (plugin téléchargeable).
- [Microsoft Teams](/fr/channels/msteams) — Bot Framework ; prise en charge entreprise (plugin groupé).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) — Discussion auto-hébergée via Nextcloud Talk (plugin groupé).
- [Nostr](/fr/channels/nostr) — MPIM décentralisés via NIP-04 (plugin groupé).
- [QQ Bot](/fr/channels/qqbot) — API QQ Bot ; discussion privée, discussion de groupe et médias enrichis (plugin groupé).
- [Signal](/fr/channels/signal) — signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) — Bolt SDK ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) — Synology NAS Chat via webhooks sortants+entrants (plugin groupé).
- [Telegram](/fr/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) — Messagerie basée sur Urbit (plugin groupé).
- [Twitch](/fr/channels/twitch) — Discussion Twitch via connexion IRC (plugin groupé).
- [Appel vocal](/fr/plugins/voice-call) — Téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/fr/web/webchat) — Interface WebChat du Gateway sur WebSocket.
- [WeChat](/fr/channels/wechat) — Plugin Tencent iLink Bot via connexion par QR ; discussions privées uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) — Le plus populaire ; utilise Baileys et nécessite l’appairage par QR.
- [Yuanbao](/fr/channels/yuanbao) — Bot Tencent Yuanbao (plugin externe).
- [Zalo](/fr/channels/zalo) — API Zalo Bot ; messagerie populaire du Vietnam (plugin groupé).
- [Zalo Personal](/fr/channels/zalouser) — Compte personnel Zalo via connexion par QR (plugin groupé).

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw acheminera chaque discussion.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite l’appairage par QR et
  stocke davantage d’état sur disque.
- Le comportement des groupes varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des MPIM et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
