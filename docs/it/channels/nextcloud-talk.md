---
read_when:
    - Sviluppo delle funzionalità del canale Nextcloud Talk
summary: Stato del supporto, funzionalità e configurazione di Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T06:48:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk è un plugin di canale scaricabile (`@openclaw/nextcloud-talk`) che collega OpenClaw a un'istanza Nextcloud self-hosted tramite un bot Webhook di Talk. Sono supportati messaggi diretti, stanze, reazioni e messaggi Markdown; i contenuti multimediali vengono inviati come URL.

## Installazione

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Usa la specifica del pacchetto senza versione per seguire il tag della versione ufficiale corrente. Specifica una versione esatta solo quando ti serve un'installazione riproducibile.

Da un checkout locale (flussi di sviluppo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Riavvia il Gateway dopo l'installazione. Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Installa il plugin (come indicato sopra).
2. Sul server Nextcloud, crea un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Mantieni `--feature response`: senza questa opzione, le risposte in uscita non riescono e restituiscono 401. Correggi un bot esistente con `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Abilita il bot nelle impostazioni della stanza di destinazione.
4. Configura OpenClaw:
   - Configurazione: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oppure variabile d'ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (solo account predefinito)

   Configurazione tramite CLI (`--url`/`--token` sono alias dei campi espliciti; `nc-talk` e `nc` funzionano come alias del canale):

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

   Segreto memorizzato in un file:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Riavvia il Gateway (oppure completa la configurazione).

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
- L'URL del Webhook deve essere raggiungibile dal server Nextcloud; imposta `webhookPublicUrl` quando il Gateway si trova dietro un proxy. Le richieste Webhook sono firmate con HMAC-SHA256 usando il segreto del bot; le firme non valide vengono rifiutate e sottoposte a limitazione della frequenza.
- I caricamenti di contenuti multimediali non sono supportati dall'API del bot; i contenuti multimediali in uscita vengono aggiunti come riga `Attachment: <url>`.
- Il payload del Webhook non distingue i messaggi diretti dalle stanze; imposta `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (memorizzate nella cache per circa 5 minuti). Senza queste opzioni, ogni conversazione viene trattata come una stanza.
- Le richieste in uscita passano attraverso la protezione SSRF. Per un host Nextcloud su una rete privata/interna attendibile, abilita esplicitamente `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Con `apiUser`/`apiPassword` e `webhookPublicUrl` impostati, `openclaw channels status` verifica il bot e avvisa quando manca la funzionalità `response`.

## Controllo degli accessi (messaggi diretti)

- Impostazione predefinita: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di abbinamento.
- Approva tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messaggi diretti pubblici: `channels.nextcloud-talk.dmPolicy="open"` insieme a `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` verifica esclusivamente gli ID utente Nextcloud (convertiti in minuscolo); i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Impostazione predefinita: `channels.nextcloud-talk.groupPolicy = "allowlist"` (richiede una menzione).
- Inserisci le stanze nell'elenco consentito con `channels.nextcloud-talk.rooms`, indicizzate tramite il token della stanza; `"*"` imposta un valore predefinito jolly:

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

- Chiavi per stanza: `requireMention` (valore predefinito: true), `enabled` (false disabilita la stanza), `allowFrom` (elenco dei mittenti consentiti per la stanza), `tools` (eccezioni di autorizzazione/negazione per gli strumenti), `skills` (limita le Skills caricate), `systemPrompt`.
- Per non consentire alcuna stanza, lascia vuoto l'elenco consentito oppure imposta `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità     | Stato          |
| ---------------- | -------------- |
| Messaggi diretti | Supportati     |
| Stanze           | Supportate     |
| Thread           | Non supportati |
| Contenuti multimediali | Solo URL |
| Reazioni         | Supportate     |
| Comandi nativi   | Non supportati |

## Riferimento di configurazione (Nextcloud Talk)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l'avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell'istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot (stringa o riferimento a un segreto).
- `channels.nextcloud-talk.botSecretFile`: percorso del file normale contenente il segreto. I collegamenti simbolici vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per le ricerche delle stanze (rilevamento dei messaggi diretti) e la verifica dello stato.
- `channels.nextcloud-talk.apiPassword`: password API/dell'app per le ricerche delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener Webhook (valore predefinito: 8788).
- `channels.nextcloud-talk.webhookHost`: host del Webhook (valore predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso del Webhook (valore predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del Webhook raggiungibile dall'esterno.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: pairing). `open` richiede `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: elenco consentito per i messaggi diretti (ID utente).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (valore predefinito: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: elenco dei mittenti consentiti nelle stanze (ID utente); se non impostato, usa `allowFrom`.
- `channels.nextcloud-talk.rooms`: impostazioni ed elenco consentito per stanza (vedi sopra).
- I gruppi statici di accesso dei mittenti possono essere indicati in `allowFrom` e `groupAllowFrom` tramite `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limite della cronologia dei gruppi (0 la disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite della cronologia dei messaggi diretti (0 la disabilita).
- `channels.nextcloud-talk.dms`: impostazioni specifiche per messaggio diretto indicizzate tramite ID utente (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: dimensione dei segmenti di testo in uscita, in caratteri (valore predefinito: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (valore predefinito) oppure `newline` per suddividere in corrispondenza delle righe vuote (limiti dei paragrafi) prima della suddivisione per lunghezza.
- `channels.nextcloud-talk.blockStreaming`: disabilita lo streaming a blocchi per questo canale.
- `channels.nextcloud-talk.blockStreamingCoalesce`: regolazione dell'unione dei blocchi nello streaming.
- `channels.nextcloud-talk.responsePrefix`: prefisso delle risposte in uscita.
- `channels.nextcloud-talk.markdown.tables`: modalità di rendering delle tabelle Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limite dei contenuti multimediali in ingresso (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: consente agli host Nextcloud privati/interni di superare la protezione SSRF.
- `channels.nextcloud-talk.accounts.<id>`: impostazioni specifiche per account (stesse chiavi); `defaultAccount` seleziona l'account predefinito. Le variabili d'ambiente `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` si applicano solo all'account predefinito.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e requisito di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
