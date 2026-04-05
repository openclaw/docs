---
read_when:
    - Quando lavori su funzionalità o webhook di Zalo
summary: Stato del supporto per i bot Zalo, funzionalità e configurazione
title: Zalo
x-i18n:
    generated_at: "2026-04-05T13:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab94642ba28e79605b67586af8f71c18bc10e0af60343a7df508e6823b6f4119
    source_path: channels/zalo.md
    workflow: 15
---

# Zalo (Bot API)

Stato: sperimentale. I DM sono supportati. La sezione [Funzionalità](#capabilities) qui sotto riflette il comportamento attuale dei bot Marketplace.

## Plugin incluso

Zalo viene distribuito come plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build
pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build più vecchia o un'installazione personalizzata che esclude Zalo, installalo
manualmente:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalo`
- Oppure da un checkout del sorgente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Dettagli: [Plugin](/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il plugin Zalo sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Imposta il token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oppure configurazione: `channels.zalo.accounts.default.botToken: "..."`.
3. Riavvia il gateway (oppure completa la configurazione).
4. L'accesso ai DM usa il pairing per impostazione predefinita; approva il codice di pairing al primo contatto.

Configurazione minima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Che cos'è

Zalo è un'app di messaggistica focalizzata sul Vietnam; la sua Bot API consente al Gateway di eseguire un bot per conversazioni 1:1.
È adatta per supporto o notifiche quando vuoi un instradamento deterministico verso Zalo.

Questa pagina riflette il comportamento attuale di OpenClaw per i **bot Zalo Bot Creator / Marketplace**.
I **bot Zalo Official Account (OA)** appartengono a una diversa superficie di prodotto Zalo e possono comportarsi in modo diverso.

- Un canale Zalo Bot API gestito dal Gateway.
- Instradamento deterministico: le risposte tornano a Zalo; il modello non sceglie mai i canali.
- I DM condividono la sessione principale dell'agente.
- La sezione [Funzionalità](#capabilities) qui sotto mostra il supporto attuale dei bot Marketplace.

## Configurazione (percorso rapido)

### 1) Crea un token bot (Zalo Bot Platform)

1. Vai su [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) ed effettua l'accesso.
2. Crea un nuovo bot e configurane le impostazioni.
3. Copia il token completo del bot (tipicamente `numeric_id:secret`). Per i bot Marketplace, il token di runtime utilizzabile può comparire nel messaggio di benvenuto del bot dopo la creazione.

### 2) Configura il token (env o config)

Esempio:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Se in seguito passi a una superficie bot Zalo in cui i gruppi sono disponibili, puoi aggiungere esplicitamente configurazioni specifiche per i gruppi come `groupPolicy` e `groupAllowFrom`. Per il comportamento attuale dei bot Marketplace, vedi [Funzionalità](#capabilities).

Opzione env: `ZALO_BOT_TOKEN=...` (funziona solo per l'account predefinito).

Supporto multi-account: usa `channels.zalo.accounts` con token per account e `name` opzionale.

3. Riavvia il gateway. Zalo si avvia quando viene risolto un token (env o config).
4. L'accesso ai DM usa il pairing per impostazione predefinita. Approva il codice quando il bot viene contattato per la prima volta.

## Come funziona (comportamento)

- I messaggi in ingresso vengono normalizzati nel contenitore canale condiviso con segnaposto per i media.
- Le risposte vengono sempre instradate di nuovo alla stessa chat Zalo.
- Long-polling per impostazione predefinita; modalità webhook disponibile con `channels.zalo.webhookUrl`.

## Limiti

- Il testo in uscita viene suddiviso in blocchi da 2000 caratteri (limite API di Zalo).
- I download/upload dei media sono limitati da `channels.zalo.mediaMaxMb` (predefinito 5).
- Lo streaming è bloccato per impostazione predefinita perché il limite di 2000 caratteri lo rende meno utile.

## Controllo degli accessi (DM)

### Accesso DM

- Predefinito: `channels.zalo.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di pairing; i messaggi vengono ignorati fino all'approvazione (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Il pairing è lo scambio di token predefinito. Dettagli: [Pairing](/it/channels/pairing)
- `channels.zalo.allowFrom` accetta ID utente numerici (non è disponibile la ricerca per nome utente).

## Controllo degli accessi (Gruppi)

Per i **bot Zalo Bot Creator / Marketplace**, il supporto ai gruppi non era disponibile nella pratica perché il bot non poteva essere aggiunto a un gruppo.

Ciò significa che le chiavi di configurazione relative ai gruppi qui sotto esistono nello schema, ma non erano utilizzabili per i bot Marketplace:

- `channels.zalo.groupPolicy` controlla la gestione dei messaggi in ingresso nei gruppi: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limita quali ID mittente possono attivare il bot nei gruppi.
- Se `groupAllowFrom` non è impostato, Zalo usa `allowFrom` come fallback per i controlli sul mittente.
- Nota di runtime: se `channels.zalo` manca completamente, il runtime usa comunque `groupPolicy="allowlist"` come fallback per sicurezza.

I valori di policy dei gruppi (quando l'accesso ai gruppi è disponibile sulla tua superficie bot) sono:

- `groupPolicy: "disabled"` — blocca tutti i messaggi di gruppo.
- `groupPolicy: "open"` — consente qualsiasi membro del gruppo (con menzione richiesta).
- `groupPolicy: "allowlist"` — predefinito fail-closed; sono accettati solo i mittenti consentiti.

Se utilizzi una diversa superficie di prodotto bot Zalo e hai verificato un comportamento di gruppo funzionante, documentalo separatamente invece di presumere che corrisponda al flusso dei bot Marketplace.

## Long-polling vs webhook

- Predefinito: long-polling (non è richiesto alcun URL pubblico).
- Modalità webhook: imposta `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - Il segreto webhook deve contenere da 8 a 256 caratteri.
  - L'URL webhook deve usare HTTPS.
  - Zalo invia eventi con l'header `X-Bot-Api-Secret-Token` per la verifica.
  - L'HTTP del Gateway gestisce le richieste webhook su `channels.zalo.webhookPath` (predefinito: il percorso dell'URL webhook).
  - Le richieste devono usare `Content-Type: application/json` (o tipi media `+json`).
  - Gli eventi duplicati (`event_name + message_id`) vengono ignorati per una breve finestra di replay.
  - Il traffico a raffica è soggetto a rate limit per percorso/sorgente e può restituire HTTP 429.

**Nota:** `getUpdates` (polling) e webhook si escludono a vicenda secondo la documentazione API di Zalo.

## Tipi di messaggio supportati

Per una rapida panoramica del supporto, vedi [Funzionalità](#capabilities). Le note qui sotto aggiungono dettagli dove il comportamento richiede più contesto.

- **Messaggi di testo**: supporto completo con suddivisione in blocchi da 2000 caratteri.
- **URL semplici nel testo**: si comportano come normale input testuale.
- **Anteprime di link / schede link avanzate**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities); non attivavano una risposta in modo affidabile.
- **Messaggi immagine**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities); la gestione delle immagini in ingresso era inaffidabile (indicatore di digitazione senza risposta finale).
- **Sticker**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities).
- **Messaggi vocali / file audio / video / allegati di file generici**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities).
- **Tipi non supportati**: registrati nei log (ad esempio, messaggi da utenti protetti).

## Funzionalità

Questa tabella riassume il comportamento attuale dei **bot Zalo Bot Creator / Marketplace** in OpenClaw.

| Funzionalità                | Stato                                   |
| --------------------------- | --------------------------------------- |
| Messaggi diretti            | ✅ Supportati                            |
| Gruppi                      | ❌ Non disponibili per i bot Marketplace |
| Media (immagini in ingresso) | ⚠️ Limitati / verifica nel tuo ambiente |
| Media (immagini in uscita)  | ⚠️ Non testati di nuovo per i bot Marketplace |
| URL semplici nel testo      | ✅ Supportati                            |
| Anteprime di link           | ⚠️ Inaffidabili per i bot Marketplace    |
| Reazioni                    | ❌ Non supportate                        |
| Sticker                     | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Messaggi vocali / audio / video | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Allegati di file            | ⚠️ Nessuna risposta dell'agente per i bot Marketplace |
| Thread                      | ❌ Non supportati                        |
| Sondaggi                    | ❌ Non supportati                        |
| Comandi nativi              | ❌ Non supportati                        |
| Streaming                   | ⚠️ Bloccato (limite di 2000 caratteri)   |

## Destinazioni di consegna (CLI/cron)

- Usa un ID chat come destinazione.
- Esempio: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Risoluzione dei problemi

**Il bot non risponde:**

- Controlla che il token sia valido: `openclaw channels status --probe`
- Verifica che il mittente sia approvato (pairing o allowFrom)
- Controlla i log del gateway: `openclaw logs --follow`

**Il webhook non riceve eventi:**

- Assicurati che l'URL webhook usi HTTPS
- Verifica che il token segreto contenga da 8 a 256 caratteri
- Conferma che l'endpoint HTTP del gateway sia raggiungibile sul percorso configurato
- Controlla che il polling `getUpdates` non sia in esecuzione (si escludono a vicenda)

## Riferimento configurazione (Zalo)

Configurazione completa: [Configurazione](/gateway/configuration)

Le chiavi flat di primo livello (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e simili) sono una scorciatoia legacy per il singolo account. Per le nuove configurazioni, preferisci `channels.zalo.accounts.<id>.*`. Entrambe le forme sono ancora documentate qui perché esistono nello schema.

Opzioni del provider:

- `channels.zalo.enabled`: abilita/disabilita l'avvio del canale.
- `channels.zalo.botToken`: token bot dalla Zalo Bot Platform.
- `channels.zalo.tokenFile`: legge il token da un percorso di file normale. I symlink vengono rifiutati.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID utente). `open` richiede `"*"`. La procedura guidata chiederà ID numerici.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist). Presente nella configurazione; vedi [Funzionalità](#capabilities) e [Controllo degli accessi (Gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist dei mittenti nei gruppi (ID utente). Usa `allowFrom` come fallback se non impostato.
- `channels.zalo.mediaMaxMb`: limite media in ingresso/uscita (MB, predefinito 5).
- `channels.zalo.webhookUrl`: abilita la modalità webhook (HTTPS richiesto).
- `channels.zalo.webhookSecret`: segreto webhook (8-256 caratteri).
- `channels.zalo.webhookPath`: percorso webhook sul server HTTP del gateway.
- `channels.zalo.proxy`: URL proxy per le richieste API.

Opzioni multi-account:

- `channels.zalo.accounts.<id>.botToken`: token per account.
- `channels.zalo.accounts.<id>.tokenFile`: file token normale per account. I symlink vengono rifiutati.
- `channels.zalo.accounts.<id>.name`: nome visualizzato.
- `channels.zalo.accounts.<id>.enabled`: abilita/disabilita l'account.
- `channels.zalo.accounts.<id>.dmPolicy`: policy DM per account.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per account.
- `channels.zalo.accounts.<id>.groupPolicy`: policy di gruppo per account. Presente nella configurazione; vedi [Funzionalità](#capabilities) e [Controllo degli accessi (Gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist dei mittenti nei gruppi per account.
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhook per account.
- `channels.zalo.accounts.<id>.webhookSecret`: segreto webhook per account.
- `channels.zalo.accounts.<id>.webhookPath`: percorso webhook per account.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per account.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e requisito di menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
