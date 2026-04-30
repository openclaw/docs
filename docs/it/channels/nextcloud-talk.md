---
read_when:
    - Lavorare sulle funzionalità del canale Nextcloud Talk
summary: Stato del supporto, funzionalità e configurazione di Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T08:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Stato: Plugin incluso (bot Webhook). Sono supportati messaggi diretti, stanze, reazioni e messaggi Markdown.

## Plugin incluso

Nextcloud Talk viene distribuito come Plugin incluso nelle release OpenClaw attuali, quindi
le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Nextcloud Talk,
installa un pacchetto npm corrente quando ne viene pubblicato uno:

Installa tramite CLI (registro npm, quando esiste un pacchetto corrente):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build
OpenClaw pacchettizzata corrente o il percorso del checkout locale finché non viene
pubblicato un pacchetto npm più recente.

Checkout locale (quando si esegue da un repository git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principiante)

1. Assicurati che il Plugin Nextcloud Talk sia disponibile.
   - Le release OpenClaw pacchettizzate attuali lo includono già.
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

- I bot non possono avviare DM. L'utente deve inviare prima un messaggio al bot.
- L'URL del Webhook deve essere raggiungibile dal Gateway; imposta `webhookPublicUrl` se si trova dietro un proxy.
- I caricamenti multimediali non sono supportati dall'API del bot; i media vengono inviati come URL.
- Il payload del Webhook non distingue tra DM e stanze; imposta `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (altrimenti i DM vengono trattati come stanze).

## Controllo accessi (DM)

- Predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di abbinamento.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud; i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controllato da menzione).
- Aggiungi le stanze alla lista consentita con `channels.nextcloud-talk.rooms`:

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

- Per non consentire alcuna stanza, mantieni vuota la lista consentita o imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità    | Stato          |
| --------------- | -------------- |
| Messaggi diretti | Supportati     |
| Stanze          | Supportate     |
| Thread          | Non supportati |
| Media           | Solo URL       |
| Reazioni        | Supportate     |
| Comandi nativi  | Non supportati |

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
- `channels.nextcloud-talk.webhookHost`: host del Webhook (predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso del Webhook (predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook raggiungibile esternamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista consentita DM (ID utente). `open` richiede `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista consentita gruppi (ID utente).
- `channels.nextcloud-talk.rooms`: impostazioni per stanza e lista consentita.
- `channels.nextcloud-talk.historyLimit`: limite della cronologia di gruppo (0 disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite della cronologia DM (0 disabilita).
- `channels.nextcloud-talk.dms`: override per DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: dimensione del blocco di testo in uscita (caratteri).
- `channels.nextcloud-talk.chunkMode`: `length` (predefinito) o `newline` per dividere sulle righe vuote (limiti di paragrafo) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita lo streaming a blocchi per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: regolazione della coalescenza dello streaming a blocchi.
- `channels.nextcloud-talk.mediaMaxMb`: limite dei media in ingresso (MB).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
