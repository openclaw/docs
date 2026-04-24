---
read_when:
    - Lavorare sulle funzionalità del canale Nextcloud Talk
summary: Stato del supporto di Nextcloud Talk, funzionalità e configurazione
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:30:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Stato: Plugin incluso (bot Webhook). Sono supportati messaggi diretti, stanze, reazioni e messaggi Markdown.

## Plugin incluso

Nextcloud Talk viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate non richiedono un’installazione separata.

Se usi una build più vecchia o un’installazione personalizzata che esclude Nextcloud Talk, installalo manualmente:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Nextcloud Talk sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni più vecchie o personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Sul tuo server Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Abilita il bot nelle impostazioni della stanza di destinazione.
4. Configura OpenClaw:
   - Configurazione: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oppure variabile d’ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (solo account predefinito)

   Configurazione tramite CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Campi espliciti equivalenti:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Segreto da file:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Riavvia il gateway (o completa la configurazione).

Configurazione minima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Note

- I bot non possono avviare DM. L’utente deve prima inviare un messaggio al bot.
- L’URL del Webhook deve essere raggiungibile dal Gateway; imposta `webhookPublicUrl` se sei dietro un proxy.
- I caricamenti di media non sono supportati dall’API bot; i media vengono inviati come URL.
- Il payload del Webhook non distingue tra DM e stanze; imposta `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (altrimenti i DM vengono trattati come stanze).

## Controllo degli accessi (DM)

- Predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di pairing.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud; i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (con gating delle menzioni).
- Metti le stanze in allowlist con `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Per non consentire alcuna stanza, lascia vuota l’allowlist oppure imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità     | Stato         |
| ---------------- | ------------- |
| Messaggi diretti | Supportato    |
| Stanze           | Supportato    |
| Thread           | Non supportato |
| Media            | Solo URL      |
| Reazioni         | Supportato    |
| Comandi nativi   | Non supportato |

## Riferimento della configurazione (Nextcloud Talk)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l’avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell’istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot.
- `channels.nextcloud-talk.botSecretFile`: percorso del segreto come file regolare. I symlink vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per le ricerche delle stanze (rilevamento DM).
- `channels.nextcloud-talk.apiPassword`: password API/app per le ricerche delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener Webhook (predefinita: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso del Webhook (predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook raggiungibile dall’esterno.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID utente). `open` richiede `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist dei gruppi (ID utente).
- `channels.nextcloud-talk.rooms`: impostazioni per stanza e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite cronologia dei gruppi (0 disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite cronologia dei DM (0 disabilita).
- `channels.nextcloud-talk.dms`: override per singolo DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: dimensione dei blocchi di testo in uscita (caratteri).
- `channels.nextcloud-talk.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita il block streaming per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: regolazione del coalescing del block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limite dei media in ingresso (MB).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
