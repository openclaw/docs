---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Ti serve una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-07-12T06:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può comunicare con te su qualsiasi app di chat che già utilizzi. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; contenuti multimediali e reazioni variano in base al canale.

iMessage, Telegram e l'interfaccia WebChat sono inclusi nell'installazione principale. I canali contrassegnati come
"plugin ufficiale" si installano con un solo comando (`openclaw plugins install @openclaw/<id>`)
oppure su richiesta durante `openclaw onboard` / `openclaw channels add`; richiedono poi il riavvio del Gateway.
I canali "plugin esterno" sono gestiti al di fuori del repository di OpenClaw.

## Canali supportati

- [Discord](/it/channels/discord) - API bot di Discord + Gateway; supporta server, canali e messaggi diretti (plugin ufficiale).
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin ufficiale).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite Webhook HTTP (plugin ufficiale).
- [iMessage](/it/channels/imessage) - Incluso nel nucleo. Integrazione nativa con macOS tramite il bridge `imsg` su un Mac con accesso effettuato (oppure tramite wrapper SSH quando il Gateway è in esecuzione altrove), incluse azioni API private per risposte, tapback, effetti, allegati e gestione dei gruppi.
- [IRC](/it/channels/irc) - Server IRC classici; canali e messaggi diretti con controlli di associazione e lista consentiti (plugin ufficiale).
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin ufficiale).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin ufficiale).
- [Mattermost](/it/channels/mattermost) - API bot + WebSocket; canali, gruppi e messaggi diretti (plugin ufficiale).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto aziendale (plugin ufficiale).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat auto-ospitata tramite Nextcloud Talk (plugin ufficiale).
- [Nostr](/it/channels/nostr) - Messaggi diretti decentralizzati tramite NIP-04 (plugin ufficiale).
- [QQ Bot](/it/channels/qqbot) - QQ Bot API; chat private, chat di gruppo e contenuti multimediali avanzati (plugin ufficiale).
- [Raft](/it/channels/raft) - Bridge di attivazione della CLI Raft per la collaborazione tra persone e agenti (plugin ufficiale).
- [Signal](/it/channels/signal) - signal-cli; incentrato sulla privacy (plugin ufficiale).
- [Slack](/it/channels/slack) - Bolt SDK; app per aree di lavoro (plugin ufficiale).
- [SMS](/it/channels/sms) - SMS basati su Twilio tramite il Webhook del Gateway (plugin ufficiale).
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite Webhook in uscita e in entrata (plugin ufficiale).
- [Telegram](/it/channels/telegram) - Incluso nel nucleo. Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Servizio di messaggistica basato su Urbit (plugin ufficiale).
- [Twitch](/it/channels/twitch) - Chat di Twitch tramite connessione IRC (plugin ufficiale).
- [Chiamata vocale](/it/plugins/voice-call) - Telefonia tramite Plivo, Telnyx o Twilio (plugin ufficiale).
- [WebChat](/it/web/webchat) - Incluso nel nucleo. Interfaccia WebChat del Gateway tramite WebSocket.
- [WeChat](/it/channels/wechat) - Bot Tencent iLink tramite accesso con codice QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; utilizza Baileys e richiede l'associazione tramite codice QR (plugin ufficiale).
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - Zalo Bot API; servizio di messaggistica popolare in Vietnam (plugin ufficiale).
- [Zalo ClawBot](/it/channels/zaloclawbot) - Assistente personale Zalo tramite accesso con codice QR; vincolato al proprietario (plugin esterno).
- [Zalo personale](/it/channels/zalouser) - Account personale Zalo tramite accesso con codice QR (plugin ufficiale).

## Note sulla consegna

- Le risposte di Telegram che contengono la sintassi Markdown per le immagini, come `![alt](url)`,
  vengono convertite, quando possibile, in risposte multimediali nel percorso finale in uscita.
- I messaggi diretti tra più persone di Slack vengono instradati come chat di gruppo; pertanto alle conversazioni MPIM
  si applicano i criteri dei gruppi, il comportamento delle menzioni e le regole delle sessioni di gruppo.
- La configurazione di WhatsApp avviene con installazione su richiesta: l'onboarding può mostrare il flusso di configurazione
  prima che il pacchetto del plugin venga installato e il Gateway carica il plugin esterno
  ClawHub/npm solo quando il canale è effettivamente attivo.
- I canali che accettano messaggi in entrata creati da bot possono utilizzare la
  [protezione condivisa dai cicli tra bot](/it/channels/bot-loop-protection) per impedire alle coppie di bot
  di rispondersi indefinitamente.
- Le stanze permanenti supportate possono utilizzare gli [eventi ambientali delle stanze](/it/channels/ambient-room-events)
  affinché le conversazioni nella stanza che non menzionano l'agente diventino un contesto silenzioso, a meno che l'agente non invii messaggi
  con lo strumento `message`.

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà i messaggi in base alla chat.
- La configurazione più rapida è solitamente **Telegram** (semplice token del bot, nessuna installazione di plugin). WhatsApp
  richiede l'associazione tramite codice QR e memorizza più stato sul disco.
- Il comportamento dei gruppi varia in base al canale; consulta [Gruppi](/it/channels/groups).
- L'associazione dei messaggi diretti e le liste consentiti vengono applicate per motivi di sicurezza; consulta [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider dei modelli sono documentati separatamente; consulta [Provider di modelli](/it/providers/models).
