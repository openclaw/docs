---
read_when:
    - Lavorare sulle funzionalità di Zalo o sui Webhook
summary: Stato del supporto per i bot Zalo, funzionalità e configurazione
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

Stato: sperimentale. I DM sono supportati. La sezione [Funzionalità](#capabilities) qui sotto riflette il comportamento attuale dei bot Marketplace.

## Plugin in bundle

Zalo viene distribuito come Plugin in bundle nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate
non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Zalo, installa direttamente il
pacchetto npm:

- Installa tramite CLI: `openclaw plugins install @openclaw/zalo`
- Versione fissata: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Oppure da un checkout sorgente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Zalo sia disponibile.
   - Le versioni pacchettizzate attuali di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Imposta il token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Oppure configurazione: `channels.zalo.accounts.default.botToken: "..."`.
3. Riavvia il gateway (o completa la configurazione).
4. L'accesso DM usa il pairing per impostazione predefinita; approva il codice di pairing al primo contatto.

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

Zalo è un'app di messaggistica orientata al Vietnam; la sua Bot API consente al Gateway di eseguire un bot per conversazioni 1:1.
È adatta per supporto o notifiche quando vuoi un routing deterministico verso Zalo.

Questa pagina riflette il comportamento attuale di OpenClaw per i **bot Zalo Bot Creator / Marketplace**.
I **bot Zalo Official Account (OA)** sono una superficie di prodotto Zalo diversa e potrebbero comportarsi diversamente.

- Un canale Zalo Bot API posseduto dal Gateway.
- Routing deterministico: le risposte tornano a Zalo; il modello non sceglie mai i canali.
- I DM condividono la sessione principale dell'agente.
- La sezione [Funzionalità](#capabilities) qui sotto mostra il supporto attuale dei bot Marketplace.

## Configurazione (percorso rapido)

### 1) Crea un token bot (Zalo Bot Platform)

1. Vai su [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e accedi.
2. Crea un nuovo bot e configura le sue impostazioni.
3. Copia il token bot completo (in genere `numeric_id:secret`). Per i bot Marketplace, il token runtime utilizzabile potrebbe comparire nel messaggio di benvenuto del bot dopo la creazione.

### 2) Configura il token (env o configurazione)

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

3. Riavvia il gateway. Zalo si avvia quando viene risolto un token (env o configurazione).
4. L'accesso DM usa il pairing per impostazione predefinita. Approva il codice quando il bot viene contattato per la prima volta.

## Come funziona (comportamento)

- I messaggi in ingresso vengono normalizzati nella busta di canale condivisa con placeholder per i media.
- Le risposte vengono sempre instradate alla stessa chat Zalo.
- Long polling per impostazione predefinita; modalità Webhook disponibile con `channels.zalo.webhookUrl`.

## Limiti

- Il testo in uscita viene suddiviso in blocchi da 2000 caratteri (limite API Zalo).
- Download/upload dei media sono limitati da `channels.zalo.mediaMaxMb` (predefinito 5).
- Lo streaming è bloccato per impostazione predefinita perché il limite di 2000 caratteri rende lo streaming meno utile.

## Controllo accessi (DM)

### Accesso DM

- Predefinito: `channels.zalo.dmPolicy = "pairing"`. I mittenti sconosciuti ricevono un codice di pairing; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Il pairing è lo scambio token predefinito. Dettagli: [Pairing](/it/channels/pairing)
- `channels.zalo.allowFrom` accetta ID utente numerici (non è disponibile la ricerca per nome utente).

## Controllo accessi (gruppi)

Per i **bot Zalo Bot Creator / Marketplace**, il supporto gruppi non era disponibile in pratica perché il bot non poteva essere aggiunto a nessun gruppo.

Questo significa che le chiavi di configurazione relative ai gruppi qui sotto esistono nello schema, ma non erano utilizzabili per i bot Marketplace:

- `channels.zalo.groupPolicy` controlla la gestione dei messaggi in ingresso nei gruppi: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limita quali ID mittente possono attivare il bot nei gruppi.
- Se `groupAllowFrom` non è impostato, Zalo ripiega su `allowFrom` per i controlli del mittente.
- Nota runtime: se `channels.zalo` manca completamente, il runtime ripiega comunque su `groupPolicy="allowlist"` per sicurezza.

I valori della policy di gruppo (quando l'accesso ai gruppi è disponibile sulla tua superficie bot) sono:

- `groupPolicy: "disabled"` — blocca tutti i messaggi di gruppo.
- `groupPolicy: "open"` — consente qualsiasi membro del gruppo (vincolato alla menzione).
- `groupPolicy: "allowlist"` — impostazione predefinita fail-closed; sono accettati solo i mittenti consentiti.

Se usi una superficie di prodotto bot Zalo diversa e hai verificato un comportamento dei gruppi funzionante, documentalo separatamente invece di presumere che corrisponda al flusso dei bot Marketplace.

## Long polling vs Webhook

- Predefinito: long polling (nessun URL pubblico richiesto).
- Modalità Webhook: imposta `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - Il segreto Webhook deve essere di 8-256 caratteri.
  - L'URL Webhook deve usare HTTPS.
  - Zalo invia eventi con l'intestazione `X-Bot-Api-Secret-Token` per la verifica.
  - L'HTTP del Gateway gestisce le richieste Webhook in `channels.zalo.webhookPath` (per impostazione predefinita il percorso dell'URL Webhook).
  - Le richieste devono usare `Content-Type: application/json` (o tipi media `+json`).
  - Gli eventi duplicati (`event_name + message_id`) vengono ignorati per una breve finestra di replay.
  - Il traffico a raffica è soggetto a rate limit per percorso/origine e può restituire HTTP 429.

**Nota:** getUpdates (polling) e Webhook si escludono a vicenda secondo la documentazione API Zalo.

## Tipi di messaggi supportati

Per una rapida panoramica del supporto, vedi [Funzionalità](#capabilities). Le note qui sotto aggiungono dettagli dove il comportamento richiede ulteriore contesto.

- **Messaggi di testo**: supporto completo con suddivisione in blocchi da 2000 caratteri.
- **URL semplici nel testo**: si comportano come normale input testuale.
- **Anteprime link / schede link avanzate**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities); non attivavano in modo affidabile una risposta.
- **Messaggi immagine**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities); la gestione delle immagini in ingresso era inaffidabile (indicatore di digitazione senza risposta finale).
- **Sticker**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities).
- **Note vocali / file audio / video / allegati file generici**: vedi lo stato dei bot Marketplace in [Funzionalità](#capabilities).
- **Tipi non supportati**: registrati nei log (per esempio, messaggi da utenti protetti).

## Funzionalità

Questa tabella riassume il comportamento attuale dei **bot Zalo Bot Creator / Marketplace** in OpenClaw.

| Funzionalità                | Stato                                           |
| --------------------------- | ----------------------------------------------- |
| Messaggi diretti            | ✅ Supportati                                   |
| Gruppi                      | ❌ Non disponibili per i bot Marketplace        |
| Media (immagini in ingresso) | ⚠️ Limitato / verifica nel tuo ambiente         |
| Media (immagini in uscita)  | ⚠️ Non ritestato per i bot Marketplace          |
| URL semplici nel testo      | ✅ Supportati                                   |
| Anteprime link              | ⚠️ Inaffidabili per i bot Marketplace           |
| Reazioni                    | ❌ Non supportate                               |
| Sticker                     | ⚠️ Nessuna risposta agente per i bot Marketplace |
| Note vocali / audio / video | ⚠️ Nessuna risposta agente per i bot Marketplace |
| Allegati file               | ⚠️ Nessuna risposta agente per i bot Marketplace |
| Thread                      | ❌ Non supportati                               |
| Sondaggi                    | ❌ Non supportati                               |
| Comandi nativi              | ❌ Non supportati                               |
| Streaming                   | ⚠️ Bloccato (limite di 2000 caratteri)          |

## Destinazioni di consegna (CLI/cron)

- Usa un ID chat come destinazione.
- Esempio: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Risoluzione dei problemi

**Il bot non risponde:**

- Controlla che il token sia valido: `openclaw channels status --probe`
- Verifica che il mittente sia approvato (pairing o allowFrom)
- Controlla i log del gateway: `openclaw logs --follow`

**Il Webhook non riceve eventi:**

- Assicurati che l'URL Webhook usi HTTPS
- Verifica che il token segreto sia di 8-256 caratteri
- Conferma che l'endpoint HTTP del gateway sia raggiungibile sul percorso configurato
- Controlla che il polling getUpdates non sia in esecuzione (si escludono a vicenda)

## Riferimento configurazione (Zalo)

Configurazione completa: [Configurazione](/it/gateway/configuration)

Le chiavi piatte di primo livello (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e simili) sono una scorciatoia legacy per account singolo. Preferisci `channels.zalo.accounts.<id>.*` per le nuove configurazioni. Entrambe le forme sono ancora documentate qui perché esistono nello schema.

Opzioni provider:

- `channels.zalo.enabled`: abilita/disabilita l'avvio del canale.
- `channels.zalo.botToken`: token bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: legge il token da un percorso file regolare. I symlink sono rifiutati.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID utente). `open` richiede `"*"`. La procedura guidata chiederà ID numerici.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist). Presente nella configurazione; vedi [Funzionalità](#capabilities) e [Controllo accessi (gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente). Ripiega su `allowFrom` quando non impostato.
- `channels.zalo.mediaMaxMb`: limite media in ingresso/uscita (MB, predefinito 5).
- `channels.zalo.webhookUrl`: abilita la modalità Webhook (HTTPS richiesto).
- `channels.zalo.webhookSecret`: segreto Webhook (8-256 caratteri).
- `channels.zalo.webhookPath`: percorso Webhook sul server HTTP del gateway.
- `channels.zalo.proxy`: URL proxy per le richieste API.

Opzioni multi-account:

- `channels.zalo.accounts.<id>.botToken`: token per account.
- `channels.zalo.accounts.<id>.tokenFile`: file token regolare per account. I symlink sono rifiutati.
- `channels.zalo.accounts.<id>.name`: nome visualizzato.
- `channels.zalo.accounts.<id>.enabled`: abilita/disabilita l'account.
- `channels.zalo.accounts.<id>.dmPolicy`: policy DM per account.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per account.
- `channels.zalo.accounts.<id>.groupPolicy`: policy di gruppo per account. Presente nella configurazione; vedi [Funzionalità](#capabilities) e [Controllo accessi (gruppi)](#access-control-groups) per il comportamento attuale dei bot Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist dei mittenti di gruppo per account.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per account.
- `channels.zalo.accounts.<id>.webhookSecret`: segreto Webhook per account.
- `channels.zalo.accounts.<id>.webhookPath`: percorso Webhook per account.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per account.

## Correlati

- [Panoramica canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating tramite menzione
- [Routing canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
