---
read_when:
    - Vous voulez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-04-25T13:41:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw peut vous parler sur n’importe quelle application de discussion que vous utilisez déjà. Chaque canal se connecte via la Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Remarques sur la distribution

- Les réponses Telegram qui contiennent une syntaxe d’image markdown, telle que `![alt](url)`,
  sont converties en réponses média sur le chemin sortant final lorsque c’est possible.
- Les messages privés Slack à plusieurs personnes sont routés comme des discussions de groupe, donc la politique de groupe, le comportement des mentions
  et les règles de session de groupe s’appliquent aux conversations MPIM.
- La configuration de WhatsApp se fait à l’installation à la demande : l’onboarding peut afficher le flux de configuration avant
  que les dépendances d’exécution Baileys ne soient préparées, et la Gateway charge l’environnement d’exécution WhatsApp
  uniquement lorsque le canal est réellement actif.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec prise en charge complète des fonctionnalités (plugin inclus ; modification, annulation d’envoi, effets, réactions, gestion des groupes — la modification est actuellement défaillante sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) — API Bot Discord + Gateway ; prend en charge les serveurs, les canaux et les messages privés.
- [Feishu](/fr/channels/feishu) — Bot Feishu/Lark via WebSocket (plugin inclus).
- [Google Chat](/fr/channels/googlechat) — Application API Google Chat via Webhook HTTP.
- [iMessage (legacy)](/fr/channels/imessage) — Intégration macOS héritée via l’outil CLI imsg (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) — Serveurs IRC classiques ; canaux + messages privés avec contrôles d’appairage/liste d’autorisations.
- [LINE](/fr/channels/line) — Bot API LINE Messaging (plugin inclus).
- [Matrix](/fr/channels/matrix) — Protocole Matrix (plugin inclus).
- [Mattermost](/fr/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, messages privés (plugin inclus).
- [Microsoft Teams](/fr/channels/msteams) — Bot Framework ; prise en charge entreprise (plugin inclus).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) — Discussion auto-hébergée via Nextcloud Talk (plugin inclus).
- [Nostr](/fr/channels/nostr) — Messages privés décentralisés via NIP-04 (plugin inclus).
- [QQ Bot](/fr/channels/qqbot) — API QQ Bot ; discussion privée, discussion de groupe et médias enrichis (plugin inclus).
- [Signal](/fr/channels/signal) — signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) — SDK Bolt ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) — Chat Synology NAS via Webhooks sortants + entrants (plugin inclus).
- [Telegram](/fr/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) — Messagerie basée sur Urbit (plugin inclus).
- [Twitch](/fr/channels/twitch) — Discussion Twitch via connexion IRC (plugin inclus).
- [Voice Call](/fr/plugins/voice-call) — Téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/fr/web/webchat) — Interface Gateway WebChat via WebSocket.
- [WeChat](/fr/channels/wechat) — Plugin Tencent iLink Bot via connexion QR ; discussions privées uniquement (plugin externe).
- [WhatsApp](/fr/channels/whatsapp) — Le plus populaire ; utilise Baileys et nécessite un appairage par QR.
- [Zalo](/fr/channels/zalo) — API Zalo Bot ; la messagerie populaire du Vietnam (plugin inclus).
- [Zalo Personal](/fr/channels/zalouser) — Compte personnel Zalo via connexion QR (plugin inclus).

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw effectuera le routage par discussion.
- La configuration la plus rapide est généralement **Telegram** (simple jeton de bot). WhatsApp nécessite un appairage par QR et
  stocke davantage d’état sur le disque.
- Le comportement des groupes varie selon le canal ; voir [Groupes](/fr/channels/groups).
- L’appairage des messages privés et les listes d’autorisations sont appliqués pour des raisons de sécurité ; voir [Sécurité](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; voir [Fournisseurs de modèles](/fr/providers/models).
