---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Ti serve una panoramica rapida delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-05-10T19:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57ae81a99d265abbf3f9f016506e787d66b4f6984d833e43e7a8554e157a3c17
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può parlarti su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note di recapito

- Le risposte Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM Slack con più persone vengono instradati come chat di gruppo, quindi le policy di gruppo, il comportamento
  delle menzioni e le regole delle sessioni di gruppo si applicano alle conversazioni MPIM.
- La configurazione di WhatsApp è install-on-demand: l'onboarding può mostrare il flusso di configurazione prima
  che il pacchetto plugin sia installato, e il Gateway carica il runtime WhatsApp
  solo quando il canale è effettivamente attivo.

## Canali supportati

- [Discord](/it/channels/discord) - Discord Bot API + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin incluso).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite webhook HTTP (plugin scaricabile).
- [iMessage](/it/channels/imessage) - Integrazione nativa macOS tramite il bridge `imsg` su un Mac con accesso effettuato (o wrapper SSH quando il Gateway viene eseguito altrove), incluse azioni API private per risposte, tapback, effetti, allegati e gestione dei gruppi. Preferito per le nuove configurazioni OpenClaw iMessage quando i permessi dell'host e l'accesso a Messaggi sono adeguati.
- [IRC](/it/channels/irc) - Server IRC classici; canali + DM con controlli di associazione/allowlist.
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin scaricabile).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin scaricabile).
- [Mattermost](/it/channels/mattermost) - Bot API + WebSocket; canali, gruppi, DM (plugin scaricabile).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto enterprise (plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat self-hosted tramite Nextcloud Talk (plugin incluso).
- [Nostr](/it/channels/nostr) - DM decentralizzati tramite NIP-04 (plugin incluso).
- [QQ Bot](/it/channels/qqbot) - QQ Bot API; chat privata, chat di gruppo e media avanzati (plugin incluso).
- [Signal](/it/channels/signal) - signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) - Bolt SDK; app workspace.
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite webhook in uscita+in entrata (plugin incluso).
- [Telegram](/it/channels/telegram) - Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Messenger basato su Urbit (plugin incluso).
- [Twitch](/it/channels/twitch) - Chat Twitch tramite connessione IRC (plugin incluso).
- [Chiamata vocale](/it/plugins/voice-call) - Telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/it/web/webchat) - UI WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) - Plugin Tencent iLink Bot tramite login QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; usa Baileys e richiede l'associazione tramite QR.
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - Zalo Bot API; popolare messenger del Vietnam (plugin incluso).
- [Zalo Personal](/it/channels/zalouser) - Account personale Zalo tramite login QR (plugin incluso).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida di solito è **Telegram** (semplice token del bot). WhatsApp richiede l'associazione tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; consulta [Gruppi](/it/channels/groups).
- L'associazione dei DM e le allowlist vengono applicate per sicurezza; consulta [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; consulta [Provider di modelli](/it/providers/models).
