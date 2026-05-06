---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-05-06T08:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può parlarti su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note sulla consegna

- Le risposte Telegram che contengono sintassi Markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM Slack multiutente vengono instradati come chat di gruppo, quindi criteri di gruppo, comportamento
  delle menzioni e regole delle sessioni di gruppo si applicano alle conversazioni MPIM.
- La configurazione di WhatsApp è installabile su richiesta: l'onboarding può mostrare il flusso di configurazione prima
  che il pacchetto plugin sia installato, e il Gateway carica il runtime WhatsApp
  solo quando il canale è effettivamente attivo.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) - **Consigliato per iMessage**; usa l'API REST del server macOS BlueBubbles con supporto completo delle funzionalità (plugin incluso; modifica, annullamento invio, effetti, reazioni, gestione gruppi - la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) - API Discord Bot + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin incluso).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite webhook HTTP (plugin scaricabile).
- [iMessage (legacy)](/it/channels/imessage) - Integrazione macOS legacy tramite CLI imsg (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) - Server IRC classici; canali + DM con controlli di associazione/allowlist.
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin scaricabile).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin scaricabile).
- [Mattermost](/it/channels/mattermost) - API Bot + WebSocket; canali, gruppi, DM (plugin scaricabile).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto enterprise (plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat self-hosted tramite Nextcloud Talk (plugin incluso).
- [Nostr](/it/channels/nostr) - DM decentralizzati tramite NIP-04 (plugin incluso).
- [QQ Bot](/it/channels/qqbot) - API QQ Bot; chat private, chat di gruppo e contenuti multimediali avanzati (plugin incluso).
- [Signal](/it/channels/signal) - signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) - Bolt SDK; app per workspace.
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite webhook in uscita+in entrata (plugin incluso).
- [Telegram](/it/channels/telegram) - API Bot tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Messenger basato su Urbit (plugin incluso).
- [Twitch](/it/channels/twitch) - Chat Twitch tramite connessione IRC (plugin incluso).
- [Voice Call](/it/plugins/voice-call) - Telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/it/web/webchat) - UI WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) - Plugin Tencent iLink Bot tramite accesso QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; usa Baileys e richiede associazione QR.
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - API Zalo Bot; il messenger popolare del Vietnam (plugin incluso).
- [Zalo Personal](/it/channels/zalouser) - Account personale Zalo tramite accesso QR (plugin incluso).

## Note

- I canali possono funzionare simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida è di solito **Telegram** (semplice token bot). WhatsApp richiede associazione QR e
  archivia più stato su disco.
- Il comportamento dei gruppi varia in base al canale; consulta [Gruppi](/it/channels/groups).
- L'associazione dei DM e le allowlist vengono applicate per sicurezza; consulta [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; consulta [Provider di modelli](/it/providers/models).
