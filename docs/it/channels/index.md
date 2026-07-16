---
read_when:
    - Si desidera scegliere un canale di chat per OpenClaw
    - Serve una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-07-16T13:59:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può comunicare con l'utente su qualsiasi app di chat già utilizzata. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; contenuti multimediali e reazioni variano in base al canale.

iMessage, Telegram e l'interfaccia WebChat sono inclusi nell'installazione principale. I canali contrassegnati come
"plugin ufficiale" si installano con un solo comando (`openclaw plugins install @openclaw/<id>`)
o su richiesta durante `openclaw onboard` / `openclaw channels add`, quindi richiedono il riavvio del Gateway.
I canali "plugin esterno" sono gestiti al di fuori del repository di OpenClaw.

## Canali supportati

- [Discord](/it/channels/discord) - API per bot Discord + Gateway; supporta server, canali e messaggi diretti (plugin ufficiale).
- [Feishu](/it/channels/feishu) - Bot Feishu/Lark tramite WebSocket (plugin ufficiale).
- [Google Chat](/it/channels/googlechat) - App Google Chat API tramite Webhook HTTP (plugin ufficiale).
- [iMessage](/it/channels/imessage) - Incluso nel core. Integrazione nativa con macOS tramite il bridge `imsg` su un Mac con accesso effettuato (o un wrapper SSH quando il Gateway viene eseguito altrove), incluse azioni dell'API privata per risposte, tapback, effetti, allegati e gestione dei gruppi.
- [IRC](/it/channels/irc) - Server IRC classici; canali e messaggi diretti con controlli di associazione/allowlist (plugin ufficiale).
- [LINE](/it/channels/line) - Bot LINE Messaging API (plugin ufficiale).
- [Matrix](/it/channels/matrix) - Protocollo Matrix (plugin ufficiale).
- [Mattermost](/it/channels/mattermost) - API per bot + WebSocket; canali, gruppi e messaggi diretti (plugin ufficiale).
- [Microsoft Teams](/it/channels/msteams) - Bot Framework; supporto aziendale (plugin ufficiale).
- [Nextcloud Talk](/it/channels/nextcloud-talk) - Chat self-hosted tramite Nextcloud Talk (plugin ufficiale).
- [Nostr](/it/channels/nostr) - Messaggi diretti decentralizzati tramite NIP-04 (plugin ufficiale).
- [QQ Bot](/it/channels/qqbot) - QQ Bot API; chat private, chat di gruppo e contenuti multimediali avanzati (plugin ufficiale).
- [Reef](/it/channels/reef) - Messaggistica protetta e crittografata end-to-end tra agenti OpenClaw di persone diverse (plugin incluso).
- [Raft](/it/channels/raft) - Bridge di attivazione della CLI Raft per la collaborazione tra persone e agenti (plugin ufficiale).
- [Signal](/it/channels/signal) - signal-cli; incentrato sulla privacy (plugin ufficiale).
- [Slack](/it/channels/slack) - Bolt SDK; app per workspace (plugin ufficiale).
- [SMS](/it/channels/sms) - SMS basati su Twilio tramite il Webhook del Gateway (plugin ufficiale).
- [Synology Chat](/it/channels/synology-chat) - Synology NAS Chat tramite webhook in uscita e in entrata (plugin ufficiale).
- [Telegram](/it/channels/telegram) - Incluso nel core. API per bot tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) - Servizio di messaggistica basato su Urbit (plugin ufficiale).
- [Twitch](/it/channels/twitch) - Chat di Twitch tramite connessione IRC (plugin ufficiale).
- [Chiamata vocale](/it/plugins/voice-call) - Telefonia tramite Plivo, Telnyx o Twilio (plugin ufficiale).
- [WebChat](/it/web/webchat) - Incluso nel core. Interfaccia WebChat del Gateway tramite WebSocket.
- [WeChat](/it/channels/wechat) - Bot Tencent iLink tramite accesso con codice QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) - Il più popolare; utilizza Baileys e richiede l'associazione tramite codice QR (plugin ufficiale).
- [Yuanbao](/it/channels/yuanbao) - Bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) - Zalo Bot API; il popolare servizio di messaggistica del Vietnam (plugin ufficiale).
- [Zalo ClawBot](/it/channels/zaloclawbot) - Assistente personale Zalo tramite accesso con codice QR; associato al proprietario (plugin esterno).
- [Zalo Personal](/it/channels/zalouser) - Account personale Zalo tramite accesso con codice QR (plugin ufficiale).

## Note sulla consegna

- Le risposte di Telegram che contengono la sintassi Markdown per le immagini, come `![alt](url)`,
  vengono convertite, quando possibile, in risposte multimediali nel percorso finale in uscita.
- I messaggi diretti di Slack con più partecipanti vengono instradati come chat di gruppo, pertanto i criteri dei gruppi, il comportamento
  delle menzioni e le regole delle sessioni di gruppo si applicano alle conversazioni MPIM.
- La configurazione di WhatsApp avviene con installazione su richiesta: l'onboarding può mostrare la procedura di configurazione prima
  che il pacchetto del plugin sia installato e il Gateway carica il plugin esterno
  ClawHub/npm solo quando il canale è effettivamente attivo.
- I canali che accettano messaggi in entrata creati da bot possono utilizzare la
  [protezione condivisa dai cicli dei bot](/it/channels/bot-loop-protection) per impedire alle coppie di bot di
  rispondersi reciprocamente all'infinito.
- Le stanze sempre attive supportate possono utilizzare gli [eventi ambientali delle stanze](/it/channels/ambient-room-events)
  affinché le conversazioni nella stanza che non menzionano l'agente diventino contesto silenzioso, a meno che l'agente non invii messaggi con
  lo strumento `message`.

## Note

- I canali possono essere eseguiti contemporaneamente; configurandone più di uno, OpenClaw eseguirà l'instradamento per ciascuna chat.
- La configurazione più rapida è generalmente **Telegram** (semplice token del bot, nessuna installazione del plugin). WhatsApp
  richiede l'associazione tramite codice QR e memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; consultare [Gruppi](/it/channels/groups).
- L'associazione dei messaggi diretti e le allowlist vengono applicate per motivi di sicurezza; consultare [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider dei modelli sono documentati separatamente; consultare [Provider dei modelli](/it/providers/models).
