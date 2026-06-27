---
read_when:
    - Vuoi scegliere un canale chat per OpenClaw
    - Ti serve una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali chat
x-i18n:
    generated_at: "2026-06-27T17:11:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può comunicare con te su qualsiasi app di chat che usi già. Ogni canale si collega tramite il Gateway.
Il testo è supportato ovunque; contenuti multimediali e reazioni variano in base al canale.

## Note sulla consegna

- Le risposte Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM multi-persona di Slack vengono instradati come chat di gruppo, quindi le policy di gruppo, il comportamento
  delle menzioni e le regole delle sessioni di gruppo si applicano alle conversazioni MPIM.
- La configurazione di WhatsApp è install-on-demand: l'onboarding può mostrare il flusso di configurazione prima
  che il pacchetto del plugin sia installato, e il Gateway carica il plugin esterno
  ClawHub/npm solo quando il canale è effettivamente attivo.
- I canali che accettano messaggi in ingresso creati da bot possono usare la
  [protezione dai loop dei bot](/it/channels/bot-loop-protection) condivisa per impedire alle coppie di bot di
  rispondersi a vicenda indefinitamente.
- Le stanze sempre attive supportate possono usare gli [eventi ambientali della stanza](/it/channels/ambient-room-events)
  in modo che le conversazioni non menzionate nella stanza diventino contesto silenzioso, a meno che l'agente non invii con
  lo strumento `message`.

## Canali supportati

- [Discord](/it/channels/discord) - Discord Bot API + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin incluso).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite Webhook HTTP (plugin scaricabile).
- [iMessage](/it/channels/imessage) - Integrazione nativa macOS tramite il bridge `imsg` su un Mac con accesso effettuato (o wrapper SSH quando il Gateway viene eseguito altrove), incluse azioni API private per risposte, tapback, effetti, allegati e gestione dei gruppi. Preferito per le nuove configurazioni iMessage di OpenClaw quando le autorizzazioni dell'host e l'accesso a Messaggi sono adatti.
- [IRC](/it/channels/irc) - Server IRC classici; canali + DM con controlli di associazione/allowlist.
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin scaricabile).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin scaricabile).
- [Mattermost](/it/channels/mattermost) - Bot API + WebSocket; canali, gruppi, DM (plugin scaricabile).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto enterprise (plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat self-hosted tramite Nextcloud Talk (plugin incluso).
- [Nostr](/it/channels/nostr) - DM decentralizzati tramite NIP-04 (plugin incluso).
- [QQ Bot](/it/channels/qqbot) - QQ Bot API; chat privata, chat di gruppo e rich media (plugin incluso).
- [Raft](/it/channels/raft) - Bridge di risveglio Raft CLI per la collaborazione tra umani e agenti (plugin esterno).
- [Signal](/it/channels/signal) - signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) - Bolt SDK; app per workspace.
- [SMS](/it/channels/sms) - SMS basati su Twilio tramite il Webhook del Gateway (plugin ufficiale).
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite webhook in uscita+in ingresso (plugin incluso).
- [Telegram](/it/channels/telegram) - Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Messenger basato su Urbit (plugin incluso).
- [Twitch](/it/channels/twitch) - Chat Twitch tramite connessione IRC (plugin incluso).
- [Voice Call](/it/plugins/voice-call) - Telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/it/web/webchat) - UI WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) - Plugin Tencent iLink Bot tramite accesso QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; usa Baileys e richiede associazione tramite QR.
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - Zalo Bot API; il messenger popolare in Vietnam (plugin incluso).
- [Zalo ClawBot](/it/channels/zaloclawbot) - Assistente Zalo personale tramite accesso QR; vincolato al proprietario (plugin esterno).
- [Zalo Personal](/it/channels/zalouser) - Account personale Zalo tramite accesso QR (plugin incluso).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida è di solito **Telegram** (semplice token del bot). WhatsApp richiede l'associazione tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; vedi [Gruppi](/it/channels/groups).
- L'associazione dei DM e le allowlist vengono applicate per sicurezza; vedi [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider dei modelli sono documentati separatamente; vedi [Provider dei modelli](/it/providers/models).
