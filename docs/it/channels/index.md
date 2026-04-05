---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-04-05T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Canali di chat

OpenClaw può parlare con te su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; contenuti multimediali e reazioni variano a seconda del canale.

## Canali supportati

- [BlueBubbles](/channels/bluebubbles) — **Consigliato per iMessage**; usa l'API REST del server macOS BlueBubbles con supporto completo delle funzionalità (plugin incluso; modifica, annullamento invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/channels/discord) — API Bot e Gateway di Discord; supporta server, canali e DM.
- [Feishu](/channels/feishu) — bot Feishu/Lark tramite WebSocket (plugin incluso).
- [Google Chat](/channels/googlechat) — app Google Chat API tramite webhook HTTP.
- [iMessage (legacy)](/channels/imessage) — integrazione macOS legacy tramite CLI imsg (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/channels/irc) — server IRC classici; canali e DM con controlli di pairing/allowlist.
- [LINE](/channels/line) — bot LINE Messaging API (plugin incluso).
- [Matrix](/channels/matrix) — protocollo Matrix (plugin incluso).
- [Mattermost](/channels/mattermost) — API Bot e WebSocket; canali, gruppi, DM (plugin incluso).
- [Microsoft Teams](/channels/msteams) — Bot Framework; supporto enterprise (plugin incluso).
- [Nextcloud Talk](/channels/nextcloud-talk) — chat self-hosted tramite Nextcloud Talk (plugin incluso).
- [Nostr](/channels/nostr) — DM decentralizzati tramite NIP-04 (plugin incluso).
- [QQ Bot](/channels/qqbot) — API QQ Bot; chat private, chat di gruppo e contenuti multimediali avanzati (plugin incluso).
- [Signal](/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/channels/slack) — SDK Bolt; app per workspace.
- [Synology Chat](/channels/synology-chat) — Chat Synology NAS tramite webhook in uscita e in entrata (plugin incluso).
- [Telegram](/channels/telegram) — API Bot tramite grammY; supporta i gruppi.
- [Tlon](/channels/tlon) — messenger basato su Urbit (plugin incluso).
- [Twitch](/channels/twitch) — chat Twitch tramite connessione IRC (plugin incluso).
- [Voice Call](/plugins/voice-call) — telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/web/webchat) — interfaccia Gateway WebChat tramite WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — plugin Tencent iLink Bot tramite login QR; solo chat private.
- [WhatsApp](/channels/whatsapp) — il più popolare; usa Baileys e richiede l'abbinamento tramite QR.
- [Zalo](/channels/zalo) — API Zalo Bot; popolare messenger del Vietnam (plugin incluso).
- [Zalo Personal](/channels/zalouser) — account personale Zalo tramite login QR (plugin incluso).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà in base alla chat.
- La configurazione più rapida è di solito **Telegram** (semplice token bot). WhatsApp richiede l'abbinamento tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia a seconda del canale; vedi [Gruppi](/channels/groups).
- Il pairing dei DM e le allowlist sono applicati per sicurezza; vedi [Sicurezza](/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; vedi [Provider di modelli](/providers/models).
