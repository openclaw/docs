---
read_when:
    - Lavorare sulle funzionalità o sui Webhook di Zalo
summary: Stato del supporto, funzionalità e configurazione del bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-30T08:41:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Stato: sperimentale. I messaggi diretti sono supportati. La sezione [Funzionalità](#capabilities) qui sotto riflette il comportamento attuale dei bot del Marketplace.

## Plugin incluso

Zalo viene distribuito come Plugin incluso nelle versioni OpenClaw attuali, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Zalo, installa un pacchetto npm attuale quando ne viene pubblicato uno:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalo`
- Oppure da un checkout sorgente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build OpenClaw pacchettizzata attuale o il percorso del checkout locale finché non viene pubblicato un pacchetto npm più recente.

## Configurazione rapida (principiante)

1. Assicurati che il Plugin Zalo sia disponibile.
   - Le versioni OpenClaw pacchettizzate attuali lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Imposta il token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oppure config: `channels.zalo.accounts.default.botToken: "..."`.
3. Riavvia il Gateway (o completa la configurazione).
4. L'accesso ai messaggi diretti usa il pairing per impostazione predefinita; approva il codice di pairing al primo contatto.

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
È una buona scelta per supporto o notifiche quando vuoi un instradamento deterministico verso Zalo.

Questa pagina riflette il comportamento attuale di OpenClaw per i **bot Zalo Bot Creator / Marketplace**.
I **bot Zalo Official Account (OA)** sono una superficie di prodotto Zalo diversa e possono comportarsi in modo diverso.

- Un canale Zalo Bot API di proprietà del Gateway.
- Instradamento deterministico: le risposte tornano a Zalo; il modello non sceglie mai i canali.
- I messaggi diretti condividono la sessione principale dell'agente.
- La sezione [Funzionalità](#capabilities) qui sotto mostra il supporto attuale dei bot del Marketplace.

## Configurazione (percorso rapido)

### 1) Crea un token del bot (Zalo Bot Platform)

1. Vai a [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e accedi.
2. Crea un nuovo bot e configura le sue impostazioni.
3. Copia il token completo del bot (in genere `numeric_id:secret`). Per i bot del Marketplace, il token di runtime utilizzabile può comparire nel messaggio di benvenuto del bot dopo la creazione.

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

Se in seguito passi a una superficie bot Zalo in cui sono disponibili i gruppi, puoi aggiungere esplicitamente configurazioni specifiche per i gruppi come `groupPolicy` e `groupAllowFrom`. Per il comportamento attuale dei bot del Marketplace, vedi [Funzionalità](#capabilities).

Opzione env: `ZALO_BOT_TOKEN=...` (funziona solo per l'account predefinito).

Supporto multi-account: usa `channels.zalo.accounts` con token per account e `name` opzionale.

3. Riavvia il Gateway. Zalo si avvia quando viene risolto un token (env o config).
4. L'accesso ai messaggi diretti usa il pairing per impostazione predefinita. Approva il codice quando il bot viene contattato per la prima volta.

## Come funziona (comportamento)

- I messaggi in entrata vengono normalizzati nell'envelope del canale condiviso con segnaposto per i media.
- Le risposte vengono sempre instradate allo stesso chat Zalo.
- Long-polling per impostazione predefinita; modalità Webhook disponibile con `channels.zalo.webhookUrl`.

## Limiti

- Il testo in uscita viene suddiviso in blocchi da 2000 caratteri (limite dell'API Zalo).
- I download/upload dei media sono limitati da `channels.zalo.mediaMaxMb` (predefinito 5).
- Lo streaming è bloccato per impostazione predefinita perché il limite di 2000 caratteri rende lo streaming meno utile.

## Controllo dell'accesso (messaggi diretti)

### Accesso ai messaggi diretti

- Predefinito: `channels.zalo.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di pairing; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Il pairing è lo scambio di token predefinito. Dettagli: [Pairing](/it/channels/pairing)
- `channels.zalo.allowFrom` accetta ID utente numerici (nessuna ricerca del nome utente disponibile).

## Controllo dell'accesso (gruppi)

Per i **bot Zalo Bot Creator / Marketplace**, il supporto dei gruppi non era disponibile in pratica perché il bot non poteva essere aggiunto a un gruppo.

Questo significa che le chiavi di configurazione relative ai gruppi qui sotto esistono nello schema, ma non erano utilizzabili per i bot del Marketplace:

- `channels.zalo.groupPolicy` controlla la gestione in entrata dei gruppi: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limita quali ID mittente possono attivare il bot nei gruppi.
- Se `groupAllowFrom` non è impostato, Zalo ripiega su `allowFrom` per i controlli del mittente.
- Nota di runtime: se `channels.zalo` manca completamente, il runtime ripiega comunque su `groupPolicy="allowlist"` per sicurezza.

I valori della policy dei gruppi (quando l'accesso ai gruppi è disponibile sulla tua superficie bot) sono:

- `groupPolicy: "disabled"` — blocca tutti i messaggi di gruppo.
- `groupPolicy: "open"` — consente qualsiasi membro del gruppo (vincolato alla menzione).
- `groupPolicy: "allowlist"` — predefinito fail-closed; vengono accettati solo i mittenti consentiti.

Se usi una superficie di prodotto bot Zalo diversa e hai verificato un comportamento di gruppo funzionante, documentalo separatamente invece di presumere che corrisponda al flusso dei bot del Marketplace.

## Long-polling rispetto a Webhook

- Predefinito: long-polling (non richiede URL pubblico).
- Modalità Webhook: imposta `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - Il segreto Webhook deve essere di 8-256 caratteri.
  - L'URL del Webhook deve usare HTTPS.
  - Zalo invia eventi con l'header `X-Bot-Api-Secret-Token` per la verifica.
  - L'HTTP del Gateway gestisce le richieste Webhook su `channels.zalo.webhookPath` (per impostazione predefinita il percorso dell'URL del Webhook).
  - Le richieste devono usare `Content-Type: application/json` (o tipi media `+json`).
  - Gli eventi duplicati (`event_name + message_id`) vengono ignorati per una breve finestra di replay.
  - Il traffico a raffica è soggetto a limitazione per percorso/sorgente e può restituire HTTP 429.

**Nota:** getUpdates (polling) e Webhook si escludono a vicenda secondo la documentazione dell'API Zalo.

## Tipi di messaggio supportati

Per un rapido riepilogo del supporto, vedi [Funzionalità](#capabilities). Le note qui sotto aggiungono dettagli dove il comportamento richiede ulteriore contesto.

- **Messaggi di testo**: supporto completo con suddivisione in blocchi da 2000 caratteri.
- **URL semplici nel testo**: si comportano come normale input di testo.
- **Anteprime link / schede link ricche**: vedi lo stato dei bot del Marketplace in [Funzionalità](#capabilities); non attivavano una risposta in modo affidabile.
- **Messaggi immagine**: vedi lo stato dei bot del Marketplace in [Funzionalità](#capabilities); la gestione delle immagini in entrata era inaffidabile (indicatore di digitazione senza risposta finale).
- **Sticker**: vedi lo stato dei bot del Marketplace in [Funzionalità](#capabilities).
- **Note vocali / file audio / video / allegati file generici**: vedi lo stato dei bot del Marketplace in [Funzionalità](#capabilities).
- **Tipi non supportati**: registrati nei log (ad esempio, messaggi da utenti protetti).

## Funzionalità

Questa tabella riassume il comportamento attuale dei **bot Zalo Bot Creator / Marketplace** in OpenClaw.

| Funzionalità                | Stato                                      |
| --------------------------- | ------------------------------------------ |
| Messaggi diretti            | ✅ Supportato                              |
| Gruppi                      | ❌ Non disponibile per i bot del Marketplace |
| Media (immagini in entrata) | ⚠️ Limitato / verifica nel tuo ambiente    |
| Media (immagini in uscita)  | ⚠️ Non ritestato per i bot del Marketplace |
| URL semplici nel testo      | ✅ Supportato                              |
| Anteprime link              | ⚠️ Inaffidabile per i bot del Marketplace  |
| Reazioni                    | ❌ Non supportato                          |
| Sticker                     | ⚠️ Nessuna risposta dell'agente per i bot del Marketplace |
| Note vocali / audio / video | ⚠️ Nessuna risposta dell'agente per i bot del Marketplace |
| Allegati file               | ⚠️ Nessuna risposta dell'agente per i bot del Marketplace |
| Thread                      | ❌ Non supportato                          |
| Sondaggi                    | ❌ Non supportato                          |
| Comandi nativi              | ❌ Non supportato                          |
| Streaming                   | ⚠️ Bloccato (limite di 2000 caratteri)     |

## Destinazioni di recapito (CLI/cron)

- Usa un ID chat come destinazione.
- Esempio: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Risoluzione dei problemi

**Il bot non risponde:**

- Controlla che il token sia valido: `openclaw channels status --probe`
- Verifica che il mittente sia approvato (pairing o allowFrom)
- Controlla i log del Gateway: `openclaw logs --follow`

**Il Webhook non riceve eventi:**

- Assicurati che l'URL del Webhook usi HTTPS
- Verifica che il token segreto sia di 8-256 caratteri
- Conferma che l'endpoint HTTP del Gateway sia raggiungibile sul percorso configurato
- Controlla che il polling getUpdates non sia in esecuzione (si escludono a vicenda)

## Riferimento di configurazione (Zalo)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Le chiavi piatte di primo livello (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e simili) sono una scorciatoia legacy per account singolo. Preferisci `channels.zalo.accounts.<id>.*` per le nuove configurazioni. Entrambe le forme sono ancora documentate qui perché esistono nello schema.

Opzioni del provider:

- `channels.zalo.enabled`: abilita/disabilita l'avvio del canale.
- `channels.zalo.botToken`: token del bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: legge il token da un percorso di file regolare. I symlink vengono rifiutati.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.zalo.allowFrom`: allowlist dei messaggi diretti (ID utente). `open` richiede `"*"`. La procedura guidata chiederà ID numerici.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist). Presente nella config; vedi [Funzionalità](#capabilities) e [Controllo dell'accesso (gruppi)](#access-control-groups) per il comportamento attuale dei bot del Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente). Ripiega su `allowFrom` quando non è impostato.
- `channels.zalo.mediaMaxMb`: limite dei media in entrata/uscita (MB, predefinito 5).
- `channels.zalo.webhookUrl`: abilita la modalità Webhook (HTTPS richiesto).
- `channels.zalo.webhookSecret`: segreto Webhook (8-256 caratteri).
- `channels.zalo.webhookPath`: percorso Webhook sul server HTTP del Gateway.
- `channels.zalo.proxy`: URL proxy per le richieste API.

Opzioni multi-account:

- `channels.zalo.accounts.<id>.botToken`: token per account.
- `channels.zalo.accounts.<id>.tokenFile`: file token regolare per account. I symlink vengono rifiutati.
- `channels.zalo.accounts.<id>.name`: nome visualizzato.
- `channels.zalo.accounts.<id>.enabled`: abilita/disabilita l'account.
- `channels.zalo.accounts.<id>.dmPolicy`: policy dei messaggi diretti per account.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per account.
- `channels.zalo.accounts.<id>.groupPolicy`: policy dei gruppi per account. Presente nella config; vedi [Funzionalità](#capabilities) e [Controllo dell'accesso (gruppi)](#access-control-groups) per il comportamento attuale dei bot del Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist dei mittenti di gruppo per account.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per account.
- `channels.zalo.accounts.<id>.webhookSecret`: segreto Webhook per account.
- `channels.zalo.accounts.<id>.webhookPath`: percorso Webhook per account.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per account.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e vincolo alla menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
