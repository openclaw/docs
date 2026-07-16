---
read_when:
    - Sviluppo delle funzionalità del canale Nextcloud Talk
summary: Stato del supporto, funzionalità e configurazione di Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T13:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk è un plugin di canale scaricabile (`@openclaw/nextcloud-talk`) che collega OpenClaw a un'istanza Nextcloud self-hosted tramite un bot webhook di Talk. Sono supportati messaggi diretti, stanze, reazioni e messaggi Markdown; i contenuti multimediali vengono inviati come URL.

## Installazione

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Utilizzare la specifica semplice del pacchetto per seguire il tag della versione ufficiale corrente. Fissare una versione esatta solo quando è necessaria un'installazione riproducibile.

Da un checkout locale (flussi di lavoro di sviluppo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Riavviare il Gateway dopo l'installazione. Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Installare il plugin (sopra).
2. Sul server Nextcloud, creare un bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Mantenere `--feature response`: senza questa opzione, le risposte in uscita restituiscono l'errore 401. Riparare un bot esistente con `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Abilitare il bot nelle impostazioni della stanza di destinazione.
4. Configurare OpenClaw:
   - Configurazione: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oppure variabili d'ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (solo account predefinito)

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

5. Riavviare il Gateway (o completare la configurazione).

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
- L'URL del webhook deve essere raggiungibile dal server Nextcloud; impostare `webhookPublicUrl` quando il Gateway si trova dietro un proxy. Le richieste webhook sono firmate con HMAC-SHA256 usando il segreto del bot; le firme non valide vengono rifiutate e sottoposte a limitazione della frequenza.
- I caricamenti di contenuti multimediali non sono supportati dall'API del bot; i contenuti multimediali in uscita vengono aggiunti come riga `Attachment: <url>`.
- Il payload del webhook non distingue i messaggi diretti dalle stanze; impostare `apiUser` + `apiPassword` per abilitare le ricerche del tipo di stanza (memorizzate nella cache per circa 5 minuti). Senza questi valori, ogni conversazione viene trattata come una stanza.
- Le richieste in uscita passano attraverso la protezione SSRF. Per un host Nextcloud su una rete privata/interna attendibile, abilitarne l'accesso con `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Con `apiUser`/`apiPassword` e `webhookPublicUrl` impostati, `openclaw channels status` verifica il bot e avvisa quando manca la funzionalità `response`.

## Controllo degli accessi (messaggi diretti)

- Valore predefinito: `channels.nextcloud-talk.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di associazione.
- Approvare tramite:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Messaggi diretti pubblici: `channels.nextcloud-talk.dmPolicy="open"` più `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corrisponde solo agli ID utente Nextcloud (in minuscolo); i nomi visualizzati vengono ignorati.

## Stanze (gruppi)

- Valore predefinito: `channels.nextcloud-talk.groupPolicy = "allowlist"` (richiede una menzione).
- Consentire le stanze con `channels.nextcloud-talk.rooms`, indicizzate per token della stanza; `"*"` imposta un valore predefinito con carattere jolly:

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

- Chiavi per stanza: `requireMention` (valore predefinito true), `enabled` (false disabilita la stanza), `allowFrom` (elenco dei mittenti consentiti per la stanza), `tools` (sostituzioni di autorizzazione/negazione degli strumenti), `skills` (limita le Skills caricate), `systemPrompt`.
- Per non consentire alcuna stanza, mantenere vuoto l'elenco degli elementi consentiti oppure impostare `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funzionalità

| Funzionalità    | Stato         |
| --------------- | ------------- |
| Messaggi diretti | Supportati    |
| Stanze          | Supportate    |
| Thread          | Non supportati |
| Contenuti multimediali | Solo URL |
| Reazioni        | Supportate    |
| Comandi nativi  | Non supportati |

## Riferimento per la configurazione (Nextcloud Talk)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.nextcloud-talk.enabled`: abilita/disabilita l'avvio del canale.
- `channels.nextcloud-talk.baseUrl`: URL dell'istanza Nextcloud.
- `channels.nextcloud-talk.botSecret`: segreto condiviso del bot (stringa o riferimento a un segreto).
- `channels.nextcloud-talk.botSecretFile`: percorso del segreto in un file normale. I collegamenti simbolici vengono rifiutati.
- `channels.nextcloud-talk.apiUser`: utente API per la ricerca delle stanze (rilevamento dei messaggi diretti) e la verifica dello stato.
- `channels.nextcloud-talk.apiPassword`: password API/dell'app per la ricerca delle stanze.
- `channels.nextcloud-talk.apiPasswordFile`: percorso del file della password API.
- `channels.nextcloud-talk.webhookPort`: porta del listener webhook (valore predefinito: 8788).
- `channels.nextcloud-talk.webhookHost`: host del webhook (valore predefinito: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: percorso del webhook (valore predefinito: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL del webhook raggiungibile dall'esterno.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: associazione). `open` richiede `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: elenco dei messaggi diretti consentiti (ID utente).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (valore predefinito: elenco degli elementi consentiti).
- `channels.nextcloud-talk.groupAllowFrom`: elenco dei mittenti consentiti nelle stanze (ID utente); se non impostato, utilizza `allowFrom`.
- `channels.nextcloud-talk.rooms`: impostazioni ed elenco degli elementi consentiti per stanza (vedere sopra).
- I gruppi statici di accesso dei mittenti possono essere richiamati da `allowFrom` e `groupAllowFrom` con `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limite della cronologia dei gruppi (0 la disabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite della cronologia dei messaggi diretti (0 la disabilita).
- `channels.nextcloud-talk.dms`: sostituzioni per messaggio diretto indicizzate per ID utente (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: dimensione dei segmenti di testo in uscita in caratteri (valore predefinito: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (valore predefinito) o `newline` per suddividere in corrispondenza delle righe vuote (limiti dei paragrafi) prima della segmentazione per lunghezza.
- `channels.nextcloud-talk.streaming.block.enabled`: abilita o disabilita lo streaming a blocchi per questo canale.
- `channels.nextcloud-talk.streaming.block.coalesce`: regolazione dell'unione nello streaming a blocchi.
- `channels.nextcloud-talk.responsePrefix`: prefisso delle risposte in uscita.
- `channels.nextcloud-talk.markdown.tables`: modalità di rendering delle tabelle Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limite dei contenuti multimediali in ingresso (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: consente agli host Nextcloud privati/interni di superare la protezione SSRF.
- `channels.nextcloud-talk.accounts.<id>`: sostituzioni per account (stesse chiavi); `defaultAccount` seleziona il valore predefinito. Le variabili d'ambiente `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` si applicano solo all'account predefinito.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e requisito di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
