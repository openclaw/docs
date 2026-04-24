---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una panoramica rapida delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-04-24T08:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw può parlarti su qualsiasi app di chat che usi già. Ogni canale si collega tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) — **Consigliato per iMessage**; usa la REST API del server macOS BlueBubbles con supporto completo delle funzionalità (Plugin incluso; modifica, annulla invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) — API Bot di Discord + Gateway; supporta server, canali e messaggi diretti.
- [Feishu](/it/channels/feishu) — bot Feishu/Lark tramite WebSocket (Plugin incluso).
- [Google Chat](/it/channels/googlechat) — app Google Chat API tramite Webhook HTTP.
- [iMessage (legacy)](/it/channels/imessage) — integrazione macOS legacy tramite CLI imsg (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) — server IRC classici; canali + messaggi diretti con controlli di pairing/allowlist.
- [LINE](/it/channels/line) — bot LINE Messaging API (Plugin incluso).
- [Matrix](/it/channels/matrix) — protocollo Matrix (Plugin incluso).
- [Mattermost](/it/channels/mattermost) — API Bot + WebSocket; canali, gruppi, messaggi diretti (Plugin incluso).
- [Microsoft Teams](/it/channels/msteams) — Bot Framework; supporto enterprise (Plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) — chat self-hosted tramite Nextcloud Talk (Plugin incluso).
- [Nostr](/it/channels/nostr) — messaggi diretti decentralizzati tramite NIP-04 (Plugin incluso).
- [QQ Bot](/it/channels/qqbot) — API QQ Bot; chat private, chat di gruppo e contenuti multimediali avanzati (Plugin incluso).
- [Signal](/it/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) — SDK Bolt; app per workspace.
- [Synology Chat](/it/channels/synology-chat) — chat Synology NAS tramite Webhook in uscita+in entrata (Plugin incluso).
- [Telegram](/it/channels/telegram) — API Bot tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) — messenger basato su Urbit (Plugin incluso).
- [Twitch](/it/channels/twitch) — chat Twitch tramite connessione IRC (Plugin incluso).
- [Voice Call](/it/plugins/voice-call) — telefonia tramite Plivo o Twilio (Plugin, installato separatamente).
- [WebChat](/it/web/webchat) — interfaccia WebChat del Gateway tramite WebSocket.
- [WeChat](/it/channels/wechat) — Plugin bot Tencent iLink tramite accesso con QR; solo chat private (Plugin esterno).
- [WhatsApp](/it/channels/whatsapp) — il più diffuso; usa Baileys e richiede l'associazione tramite QR.
- [Zalo](/it/channels/zalo) — API Zalo Bot; il messenger più popolare in Vietnam (Plugin incluso).
- [Zalo Personal](/it/channels/zalouser) — account personale Zalo tramite accesso con QR (Plugin incluso).

## Note

- I canali possono funzionare contemporaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida di solito è **Telegram** (semplice token bot). WhatsApp richiede l'associazione tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; consulta [Gruppi](/it/channels/groups).
- Il pairing dei messaggi diretti e le allowlist vengono applicati per sicurezza; consulta [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; consulta [Provider di modelli](/it/providers/models).
