---
read_when:
    - Lavoro sulle funzionalità del canale Nextcloud Talk
summary: Stato del supporto Nextcloud Talk, capacità e configurazione
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T13:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Stato: plugin incluso (bot webhook). I messaggi diretti, le stanze, le reazioni e i messaggi in markdown sono supportati.

## Plugin incluso

Nextcloud Talk è distribuito come plugin incluso nelle attuali release di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Nextcloud Talk, installalo manualmente:

Installazione tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Dettagli: [Plugins](/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il plugin Nextcloud Talk sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Sul tuo server Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Abilita il bot nelle impostazioni della stanza di destinazione.
4. Configura OpenClaw:
   - Configurazione: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oppure env: `NEXTCLOUD_TALK_BOT_SECRET` (solo account predefinito)
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

- I bot non possono avviare DM. L'utente deve prima inviare un messaggio al bot.
- L'URL del webhook deve essere raggiungibile dal Gateway; imposta `webhookPublicUrl` se sei dietro un proxy.
- I caricamenti di contenuti multimediali non sono supportati dall'API del bot; i contenuti multimediali vengono inviati come URL.
- Il payload del webhook non distingue tra DM e stanze; imposta `apiUser` + `apiPassword` per abilitare il rilevamento del tipo di stanza (altrimenti i DM vengono trattati come stanze).

## Controllo degli accessi (DM)

- Predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di pairing.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud; i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controllato tramite menzione).
- Inserisci le stanze nella allowlist con `channels.nextcloud-talk.rooms`:

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

- Per non consentire alcuna stanza, lascia vuota la allowlist oppure imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacità

| Funzionalità      | Stato         |
| ----------------- | ------------- |
| Messaggi diretti  | Supportato    |
| Stanze            | Supportato    |
| Thread            | Non supportato |
| Contenuti multimediali | Solo URL |
| Reazioni          | Supportato    |
| Comandi nativi    | Non supportato |

## Riferimento di configurazione (Nextcloud Talk)

Configurazione completa: [Configuration](/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l'avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell'istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot.
- `channels.nextcloud-talk.botSecretFile`: percorso del segreto in file regolare. I symlink vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per il rilevamento delle stanze (rilevamento DM).
- `channels.nextcloud-talk.apiPassword`: password API/app per il rilevamento delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener webhook (predefinito: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhook (predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso webhook (predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del webhook raggiungibile esternamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID utente). `open` richiede `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist di gruppo (ID utente).
- `channels.nextcloud-talk.rooms`: impostazioni per stanza e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite cronologia di gruppo (0 disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite cronologia DM (0 disabilita).
- `channels.nextcloud-talk.dms`: override per singolo DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: dimensione della suddivisione del testo in uscita (caratteri).
- `channels.nextcloud-talk.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita il block streaming per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: regolazione del coalescing del block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limite dei contenuti multimediali in ingresso (MB).

## Correlati

- [Channels Overview](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Channel Routing](/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/gateway/security) — modello di accesso e hardening
