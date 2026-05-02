---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-05-02T08:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw può parlare con te su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note sulla consegna

- Le risposte Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM Slack con più persone vengono instradati come chat di gruppo, quindi ai colloqui MPIM si applicano le policy di gruppo, il comportamento delle menzioni
  e le regole delle sessioni di gruppo.
- La configurazione di WhatsApp avviene con installazione su richiesta: l'onboarding può mostrare il flusso di configurazione prima
  che il pacchetto del plugin sia installato, e il Gateway carica il runtime di WhatsApp
  solo quando il canale è effettivamente attivo.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) — **Consigliato per iMessage**; usa l'API REST del server BlueBubbles per macOS con supporto completo delle funzionalità (plugin incluso; modifica, annullamento dell'invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) — Discord Bot API + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) — bot Feishu/Lark tramite WebSocket (plugin incluso).
- [Google Chat](/it/channels/googlechat) — app Google Chat API tramite Webhook HTTP (plugin scaricabile).
- [iMessage (legacy)](/it/channels/imessage) — integrazione macOS legacy tramite imsg CLI (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) — server IRC classici; canali + DM con controlli di abbinamento/allowlist.
- [LINE](/it/channels/line) — bot LINE Messaging API (plugin scaricabile).
- [Matrix](/it/channels/matrix) — protocollo Matrix (plugin scaricabile).
- [Mattermost](/it/channels/mattermost) — Bot API + WebSocket; canali, gruppi, DM (plugin scaricabile).
- [Microsoft Teams](/it/channels/msteams) — Bot Framework; supporto enterprise (plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) — chat self-hosted tramite Nextcloud Talk (plugin incluso).
- [Nostr](/it/channels/nostr) — DM decentralizzati tramite NIP-04 (plugin incluso).
- [QQ Bot](/it/channels/qqbot) — QQ Bot API; chat private, chat di gruppo e rich media (plugin incluso).
- [Signal](/it/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) — Bolt SDK; app per workspace.
- [Synology Chat](/it/channels/synology-chat) — Synology NAS Chat tramite Webhook in uscita+in ingresso (plugin incluso).
- [Telegram](/it/channels/telegram) — Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) — messenger basato su Urbit (plugin incluso).
- [Twitch](/it/channels/twitch) — chat Twitch tramite connessione IRC (plugin incluso).
- [Voice Call](/it/plugins/voice-call) — telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/it/web/webchat) — interfaccia WebChat del Gateway su WebSocket.
- [WeChat](/it/channels/wechat) — plugin Tencent iLink Bot tramite accesso QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) — il più popolare; usa Baileys e richiede l'abbinamento QR.
- [Yuanbao](/it/channels/yuanbao) — bot Tencent Yuanbao (plugin esterno).
- [Zalo](/it/channels/zalo) — Zalo Bot API; messenger popolare in Vietnam (plugin incluso).
- [Zalo Personal](/it/channels/zalouser) — account personale Zalo tramite accesso QR (plugin incluso).

## Note

- I canali possono essere eseguiti contemporaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida è di solito **Telegram** (semplice token bot). WhatsApp richiede l'abbinamento QR e
  archivia più stato su disco.
- Il comportamento dei gruppi varia in base al canale; consulta [Gruppi](/it/channels/groups).
- L'abbinamento dei DM e le allowlist vengono applicati per sicurezza; consulta [Sicurezza](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; consulta [Provider di modelli](/it/providers/models).
