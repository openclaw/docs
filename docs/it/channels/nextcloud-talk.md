---
read_when:
    - Lavorare sulle funzionalità del canale Nextcloud Talk
summary: Stato del supporto, funzionalità e configurazione di Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Stato: Plugin in bundle (bot Webhook). Sono supportati messaggi diretti, stanze, reazioni e messaggi markdown.

## Plugin in bundle

Nextcloud Talk viene distribuito come Plugin in bundle nelle versioni OpenClaw attuali, quindi
le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Nextcloud Talk,
installa direttamente il pacchetto npm:

Installa tramite CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa il pacchetto semplice per seguire il tag di rilascio ufficiale attuale. Fissa una
versione esatta solo quando ti serve un'installazione riproducibile.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principiante)

1. Assicurati che il Plugin Nextcloud Talk sia disponibile.
   - Le versioni OpenClaw pacchettizzate attuali lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Sul tuo server Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
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

- I bot non possono avviare DM. L'utente deve prima inviare un messaggio al bot.
- L'URL Webhook deve essere raggiungibile dal Gateway; imposta `webhookPublicUrl` se sei dietro un proxy.
- I caricamenti multimediali non sono supportati dall'API del bot; i contenuti multimediali vengono inviati come URL.
- Il payload Webhook non distingue DM e stanze; imposta `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (altrimenti i DM vengono trattati come stanze).

## Controllo degli accessi (DM)

- Predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di abbinamento.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud; i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (con accesso tramite menzione).
- Inserisci le stanze nell'elenco consentiti con `channels.nextcloud-talk.rooms`:

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

- Per non consentire alcuna stanza, lascia vuoto l'elenco consentiti oppure imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità    | Stato          |
| --------------- | -------------- |
| Messaggi diretti | Supportato    |
| Stanze          | Supportato     |
| Thread          | Non supportato |
| Media           | Solo URL       |
| Reazioni        | Supportato     |
| Comandi nativi  | Non supportato |

## Riferimento di configurazione (Nextcloud Talk)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l'avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell'istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot.
- `channels.nextcloud-talk.botSecretFile`: percorso del segreto in file regolare. I symlink vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per le ricerche delle stanze (rilevamento DM).
- `channels.nextcloud-talk.apiPassword`: password API/app per le ricerche delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener Webhook (predefinita: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso Webhook (predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook raggiungibile dall'esterno.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: elenco consentiti per DM (ID utente). `open` richiede `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: elenco consentiti per gruppi (ID utente).
- `channels.nextcloud-talk.rooms`: impostazioni per stanza ed elenco consentiti.
- `channels.nextcloud-talk.historyLimit`: limite della cronologia dei gruppi (0 disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite della cronologia DM (0 disabilita).
- `channels.nextcloud-talk.dms`: override per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: dimensione del blocco di testo in uscita (caratteri).
- `channels.nextcloud-talk.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita lo streaming a blocchi per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: regolazione della fusione dello streaming a blocchi.
- `channels.nextcloud-talk.mediaMaxMb`: limite dei media in ingresso (MB).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e accesso tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
