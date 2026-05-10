---
read_when:
    - Lavorare sulle funzionalità del canale Nextcloud Talk
summary: Stato del supporto, funzionalità e configurazione di Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: Plugin incluso (bot Webhook). Sono supportati messaggi diretti, stanze, reazioni e messaggi markdown.

## Plugin incluso

Nextcloud Talk viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi
le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Nextcloud Talk,
installa direttamente il pacchetto npm:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa il pacchetto senza versione per seguire il tag della release ufficiale corrente. Blocca una
versione esatta solo quando ti serve un'installazione riproducibile.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Nextcloud Talk sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Sul tuo server Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Abilita il bot nelle impostazioni della stanza di destinazione.
4. Configura OpenClaw:
   - Configurazione: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oppure env: `NEXTCLOUD_TALK_BOT_SECRET` (solo account predefinito)

   Configurazione CLI:

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

   Segreto basato su file:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Riavvia il Gateway (o completa la configurazione).

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

- I bot non possono avviare messaggi diretti. L'utente deve prima inviare un messaggio al bot.
- L'URL del Webhook deve essere raggiungibile dal Gateway; imposta `webhookPublicUrl` se si trova dietro un proxy.
- I caricamenti multimediali non sono supportati dall'API del bot; i media vengono inviati come URL.
- Il payload del Webhook non distingue tra messaggi diretti e stanze; imposta `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (altrimenti i messaggi diretti vengono trattati come stanze).

## Controllo degli accessi (messaggi diretti)

- Predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di associazione.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messaggi diretti pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud; i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (con accesso tramite menzione).
- Inserisci le stanze consentite in `channels.nextcloud-talk.rooms`:

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

- Per non consentire alcuna stanza, mantieni vuota la lista consentita oppure imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità     | Stato          |
| ---------------- | -------------- |
| Messaggi diretti | Supportati     |
| Stanze           | Supportate     |
| Thread           | Non supportati |
| Media            | Solo URL       |
| Reazioni         | Supportate     |
| Comandi nativi   | Non supportati |

## Riferimento di configurazione (Nextcloud Talk)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l'avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell'istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot.
- `channels.nextcloud-talk.botSecretFile`: percorso del segreto in un file regolare. I symlink vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per le ricerche delle stanze (rilevamento dei messaggi diretti).
- `channels.nextcloud-talk.apiPassword`: password API/app per le ricerche delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener Webhook (predefinita: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso del Webhook (predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook raggiungibile dall'esterno.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista consentita per i messaggi diretti (ID utente). `open` richiede `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista consentita per i gruppi (ID utente).
- `channels.nextcloud-talk.rooms`: impostazioni per stanza e lista consentita.
- I gruppi di accesso statici dei mittenti possono essere referenziati da `allowFrom` e `groupAllowFrom` con `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limite della cronologia dei gruppi (0 disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite della cronologia dei messaggi diretti (0 disabilita).
- `channels.nextcloud-talk.dms`: override per messaggio diretto (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: dimensione dei blocchi di testo in uscita (caratteri).
- `channels.nextcloud-talk.chunkMode`: `length` (predefinito) o `newline` per dividere sulle righe vuote (confini dei paragrafi) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita lo streaming a blocchi per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ottimizzazione della coalescenza dello streaming a blocchi.
- `channels.nextcloud-talk.mediaMaxMb`: limite dei media in ingresso (MB).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e accesso tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
