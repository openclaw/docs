---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Ti serve una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali chat
x-i18n:
    generated_at: "2026-04-30T08:37:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può comunicare con te su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note sulla consegna

- Le risposte Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita, quando possibile.
- I DM Slack con più persone vengono instradati come chat di gruppo, quindi alle conversazioni MPIM si applicano le norme di gruppo, il comportamento delle menzioni
  e le regole delle sessioni di gruppo.
- La configurazione di WhatsApp è install-on-demand: l'onboarding può mostrare il flusso di configurazione prima
  che le dipendenze runtime di Baileys siano preparate, e il Gateway carica il runtime WhatsApp
  solo quando il canale è effettivamente attivo.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) — **Consigliato per iMessage**; usa l'API REST del server BlueBubbles per macOS con supporto completo delle funzionalità (Plugin in bundle; modifica, annullamento invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) — API Bot Discord + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) — bot Feishu/Lark tramite WebSocket (Plugin in bundle).
- [Google Chat](/it/channels/googlechat) — app API Google Chat tramite Webhook HTTP.
- [iMessage (legacy)](/it/channels/imessage) — Integrazione macOS legacy tramite CLI imsg (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) — Server IRC classici; canali + DM con controlli di pairing/allowlist.
- [LINE](/it/channels/line) — bot LINE Messaging API (Plugin in bundle).
- [Matrix](/it/channels/matrix) — protocollo Matrix (Plugin in bundle).
- [Mattermost](/it/channels/mattermost) — API Bot + WebSocket; canali, gruppi, DM (Plugin in bundle).
- [Microsoft Teams](/it/channels/msteams) — Bot Framework; supporto enterprise (Plugin in bundle).
- [Nextcloud Talk](/it/channels/nextcloud-talk) — Chat self-hosted tramite Nextcloud Talk (Plugin in bundle).
- [Nostr](/it/channels/nostr) — DM decentralizzati tramite NIP-04 (Plugin in bundle).
- [QQ Bot](/it/channels/qqbot) — API QQ Bot; chat privata, chat di gruppo e rich media (Plugin in bundle).
- [Signal](/it/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) — Bolt SDK; app per workspace.
- [Synology Chat](/it/channels/synology-chat) — Synology NAS Chat tramite Webhook in uscita+in entrata (Plugin in bundle).
- [Telegram](/it/channels/telegram) — API Bot tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) — Messenger basato su Urbit (Plugin in bundle).
- [Twitch](/it/channels/twitch) — Chat Twitch tramite connessione IRC (Plugin in bundle).
- [Chiamata vocale](/it/plugins/voice-call) — Telefonia tramite Plivo o Twilio (Plugin, installato separatamente).
- [WebChat](/it/web/webchat) — UI WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) — Plugin Tencent iLink Bot tramite login QR; solo chat private (Plugin esterno).
- [WhatsApp](/it/channels/whatsapp) — Il più popolare; usa Baileys e richiede pairing QR.
- [Yuanbao](/it/channels/yuanbao) — bot Tencent Yuanbao (Plugin esterno).
- [Zalo](/it/channels/zalo) — API Zalo Bot; il messenger popolare in Vietnam (Plugin in bundle).
- [Zalo Personal](/it/channels/zalouser) — account personale Zalo tramite login QR (Plugin in bundle).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida è di solito **Telegram** (semplice token del bot). WhatsApp richiede pairing QR e
  archivia più stato su disco.
- Il comportamento dei gruppi varia in base al canale; vedi [Gruppi](/it/channels/groups).
- Pairing dei DM e allowlist vengono applicati per sicurezza; vedi [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; vedi [Provider di modelli](/it/providers/models).
