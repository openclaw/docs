---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-05-07T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può parlare con te su qualsiasi app di chat che già usi. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note sulla consegna

- Le risposte Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM Slack con più persone vengono instradati come chat di gruppo, quindi policy di gruppo, comportamento
  delle menzioni e regole delle sessioni di gruppo si applicano alle conversazioni MPIM.
- La configurazione di WhatsApp è install-on-demand: l'onboarding può mostrare il flusso di configurazione prima
  che il pacchetto plugin sia installato, e il Gateway carica il runtime di WhatsApp
  solo quando il canale è effettivamente attivo.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) - Bridge iMessage legacy tramite l'API REST del server macOS BlueBubbles; deprecato per le nuove configurazioni OpenClaw ma ancora supportato per le configurazioni esistenti e per azioni private-API più ricche.
- [Discord](/it/channels/discord) - Discord Bot API + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin in bundle).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite webhook HTTP (plugin scaricabile).
- [iMessage](/it/channels/imessage) - Integrazione macOS nativa tramite CLI imsg; consigliata per le nuove configurazioni iMessage di OpenClaw quando le autorizzazioni dell'host e l'accesso a Messaggi sono compatibili.
- [IRC](/it/channels/irc) - Server IRC classici; canali + DM con controlli di pairing/allowlist.
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin scaricabile).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin scaricabile).
- [Mattermost](/it/channels/mattermost) - Bot API + WebSocket; canali, gruppi, DM (plugin scaricabile).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto enterprise (plugin in bundle).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat self-hosted tramite Nextcloud Talk (plugin in bundle).
- [Nostr](/it/channels/nostr) - DM decentralizzati tramite NIP-04 (plugin in bundle).
- [QQ Bot](/it/channels/qqbot) - QQ Bot API; chat private, chat di gruppo e media avanzati (plugin in bundle).
- [Signal](/it/channels/signal) - signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) - Bolt SDK; app per workspace.
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite webhook in uscita+in entrata (plugin in bundle).
- [Telegram](/it/channels/telegram) - Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Messenger basato su Urbit (plugin in bundle).
- [Twitch](/it/channels/twitch) - Chat Twitch tramite connessione IRC (plugin in bundle).
- [Chiamata vocale](/it/plugins/voice-call) - Telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/it/web/webchat) - UI WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) - Plugin Tencent iLink Bot tramite accesso con QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; usa Baileys e richiede il pairing tramite QR.
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - Zalo Bot API; popolare messenger del Vietnam (plugin in bundle).
- [Zalo Personal](/it/channels/zalouser) - Account personale Zalo tramite accesso con QR (plugin in bundle).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida è di solito **Telegram** (semplice token del bot). WhatsApp richiede il pairing tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; vedi [Gruppi](/it/channels/groups).
- Pairing dei DM e allowlist sono applicati per sicurezza; vedi [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; vedi [Provider di modelli](/it/providers/models).
