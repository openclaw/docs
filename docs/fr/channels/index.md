---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-05-06T07:14:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw peut communiquer avec vous sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Notes de livraison

- Les réponses Telegram qui contiennent une syntaxe d’image Markdown, comme `![alt](url)`,
  sont converties en réponses média sur le chemin de sortie final lorsque c’est possible.
- Les DM Slack à plusieurs personnes sont acheminés comme des discussions de groupe ; la politique de groupe, le comportement des mentions
  et les règles de session de groupe s’appliquent donc aux conversations MPIM.
- La configuration de WhatsApp se fait par installation à la demande : l’intégration peut afficher le flux de configuration avant
  l’installation du paquet Plugin, et le Gateway charge l’environnement d’exécution WhatsApp
  uniquement lorsque le canal est effectivement actif.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) - **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec prise en charge complète des fonctionnalités (Plugin groupé ; modification, annulation d’envoi, effets, réactions, gestion de groupe - la modification est actuellement cassée sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) - API Discord Bot + Gateway ; prend en charge les serveurs, les canaux et les DM.
- [Feishu](/fr/channels/feishu) - Bot Feishu/Lark via WebSocket (Plugin groupé).
- [Google Chat](/fr/channels/googlechat) - Application Google Chat API via Webhook HTTP (Plugin téléchargeable).
- [iMessage (ancien)](/fr/channels/imessage) - Ancienne intégration macOS via imsg CLI (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) - Serveurs IRC classiques ; canaux + DM avec contrôles d’appairage et de liste d’autorisation.
- [LINE](/fr/channels/line) - Bot LINE Messaging API (Plugin téléchargeable).
- [Matrix](/fr/channels/matrix) - Protocole Matrix (Plugin téléchargeable).
- [Mattermost](/fr/channels/mattermost) - API Bot + WebSocket ; canaux, groupes, DM (Plugin téléchargeable).
- [Microsoft Teams](/fr/channels/msteams) - Bot Framework ; prise en charge entreprise (Plugin groupé).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) - Chat auto-hébergé via Nextcloud Talk (Plugin groupé).
- [Nostr](/fr/channels/nostr) - DM décentralisés via NIP-04 (Plugin groupé).
- [QQ Bot](/fr/channels/qqbot) - API QQ Bot ; discussion privée, discussion de groupe et médias enrichis (Plugin groupé).
- [Signal](/fr/channels/signal) - signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) - Bolt SDK ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) - Synology NAS Chat via Webhooks sortants+entrants (Plugin groupé).
- [Telegram](/fr/channels/telegram) - API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) - Messagerie basée sur Urbit (Plugin groupé).
- [Twitch](/fr/channels/twitch) - Chat Twitch via connexion IRC (Plugin groupé).
- [Voice Call](/fr/plugins/voice-call) - Téléphonie via Plivo ou Twilio (Plugin, installé séparément).
- [WebChat](/fr/web/webchat) - Interface utilisateur Gateway WebChat via WebSocket.
- [WeChat](/fr/channels/wechat) - Plugin Tencent iLink Bot via connexion par QR ; discussions privées uniquement (Plugin externe).
- [WhatsApp](/fr/channels/whatsapp) - Le plus populaire ; utilise Baileys et nécessite un appairage par QR.
- [Yuanbao](/fr/channels/yuanbao) - Bot Tencent Yuanbao (Plugin externe).
- [Zalo](/fr/channels/zalo) - API Zalo Bot ; messagerie populaire du Vietnam (Plugin groupé).
- [Zalo Personal](/fr/channels/zalouser) - Compte personnel Zalo via connexion par QR (Plugin groupé).

## Notes

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw acheminera les messages par chat.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage par QR et
  stocke davantage d’état sur le disque.
- Le comportement des groupes varie selon le canal ; consultez [Groupes](/fr/channels/groups).
- L’appairage des DM et les listes d’autorisation sont appliqués pour la sécurité ; consultez [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Fournisseurs de modèles](/fr/providers/models).
