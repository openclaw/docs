---
read_when:
    - Sviluppo di funzionalità o Webhook per Zalo
summary: Stato del supporto, funzionalità e configurazione del bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T06:52:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Stato: sperimentale. Sono implementati sia i messaggi diretti sia le chat di gruppo; la tabella delle [funzionalità](#capabilities) seguente riflette il comportamento verificato sui bot Zalo Bot Creator / Marketplace.

## Plugin incluso

Zalo viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le build pacchettizzate non richiedono un'installazione separata.

In una build meno recente o in un'installazione personalizzata che esclude Zalo, installa direttamente il pacchetto npm:

- Installazione: `openclaw plugins install @openclaw/zalo`
- Versione fissata: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Da un checkout locale: `openclaw plugins install ./path/to/local/zalo-plugin`
- Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

1. Crea un token per il bot su [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (accedi, crea un bot, configura le impostazioni). Il token ha il formato `numeric_id:secret`; per i bot Marketplace, il token utilizzabile in fase di esecuzione può apparire nel messaggio di benvenuto del bot.
2. Imposta il token, tramite la variabile di ambiente `ZALO_BOT_TOKEN=...` (solo per l'account predefinito) oppure nella configurazione.
3. Riavvia il Gateway.
4. Approva il codice di associazione al primo contatto tramite messaggio diretto (il criterio predefinito per i messaggi diretti è l'associazione).

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

Account multipli: aggiungi altre voci in `channels.zalo.accounts.<id>`, ciascuna con i propri `botToken`/`name`. `channels.zalo.botToken` (struttura piatta, senza `accounts`) è una forma abbreviata legacy per un singolo account; per le nuove configurazioni, preferisci `accounts.<id>.*`.

## Che cos'è

Zalo è un'app di messaggistica orientata al mercato vietnamita. La sua API per bot consente al Gateway di eseguire un bot sia per conversazioni individuali sia per chat di gruppo, con instradamento deterministico verso Zalo (il modello non sceglie mai i canali).

Questa pagina tratta i **bot Zalo Bot Creator / Marketplace**. I **bot Zalo Official Account (OA)** costituiscono una superficie di prodotto diversa e possono comportarsi diversamente; questa pagina non li tratta.

## Funzionamento

- I messaggi in entrata vengono normalizzati nell'involucro condiviso del canale con segnaposto per i contenuti multimediali.
- Le risposte vengono sempre instradate alla stessa chat Zalo; la risposta con citazione non viene utilizzata (`replyToMode` è disattivato in modo fisso).
- Per impostazione predefinita viene usato il long polling (`getUpdates`); la modalità Webhook è disponibile tramite `channels.zalo.webhookUrl`.
- Nei gruppi è necessaria una @menzione per attivare il bot; questa impostazione non è configurabile per singolo canale.

## Limiti

| Limite                                      | Valore                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Dimensione dei blocchi di testo in uscita   | 2000 caratteri (limite dell'API Zalo)                                                          |
| Dimensione dei contenuti multimediali       | `channels.zalo.mediaMaxMb`, valore predefinito `5` MB                                          |
| Corpo della richiesta Webhook               | 1 MB, timeout di lettura di 30 s                                                               |
| Limite di frequenza del Webhook              | 120 richieste / 60 s per percorso+IP client, quindi HTTP 429                                   |
| Finestra degli eventi Webhook duplicati      | 5 minuti (chiave basata su percorso + account + nome evento + chat + mittente + ID messaggio)  |

## Controllo degli accessi

### Messaggi diretti

- `channels.zalo.dmPolicy`: `pairing` (predefinito) | `allowlist` | `open` | `disabled`.
- Associazione: i mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati fino all'approvazione. I codici scadono dopo 1 ora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Dettagli: [Associazione](/it/channels/pairing)
- `channels.zalo.allowFrom` accetta ID utente Zalo numerici (nessuna ricerca per nome utente). `open` richiede `"*"`.

### Gruppi

Le chat di gruppo sono supportate dal Plugin (`chatTypes: ["direct", "group"]`) e sono subordinate alla menzione e al criterio per i gruppi:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` limita gli ID dei mittenti che possono attivare il bot nei gruppi; se non è impostato, usa `allowFrom`.
- Risoluzione predefinita: quando `channels.zalo` è configurato, un `groupPolicy` non impostato viene risolto in `open`. Quando `channels.zalo` è completamente assente, l'esecuzione adotta una modalità chiusa e usa `allowlist`.
- Avvertenza segnalata nell'uso reale: in alcune configurazioni di bot Marketplace non è stato possibile aggiungere il bot a un gruppo. Se riscontri questo problema, verifica le impostazioni del bot nella Zalo Bot Platform; si tratta di un vincolo della piattaforma, non di un criterio di OpenClaw.

## Long polling e Webhook

- Impostazione predefinita: long polling (non è richiesto un URL pubblico).
- Modalità Webhook: imposta `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - L'URL del Webhook deve usare HTTPS.
  - Il segreto del Webhook deve contenere da 8 a 256 caratteri.
  - Zalo invia gli eventi con un'intestazione `X-Bot-Api-Secret-Token`, verificata con un confronto a tempo costante.
  - Il server HTTP del Gateway gestisce le richieste Webhook nel percorso `channels.zalo.webhookPath` (per impostazione predefinita, il percorso dell'URL del Webhook).
  - Le richieste devono usare `Content-Type: application/json` (oppure un tipo di contenuto multimediale `+json`).
  - Secondo la documentazione dell'API Zalo, il polling `getUpdates` e il Webhook si escludono a vicenda.

## Tipi di messaggio supportati

- Testo: supporto completo, suddiviso in blocchi di 2000 caratteri.
- Contenuti multimediali: in entrata e in uscita, limitati da `mediaMaxMb`.
- Reazioni, thread, sondaggi, comandi nativi: non supportati dal Plugin.
- Streaming: il Plugin dichiara la funzionalità di streaming a blocchi, ma Zalo non dispone di opzioni dedicate per la coda in uscita o la regolazione dell'unione del testo (a differenza di alcuni altri canali regionali); se questo aspetto è importante per il tuo caso d'uso, verifica il comportamento corrente nel tuo ambiente.

## Funzionalità

| Funzionalità                           | Stato                                      |
| -------------------------------------- | ------------------------------------------ |
| Messaggi diretti                       | Supportati                                 |
| Gruppi                                 | Supportati (richiedono una menzione)       |
| Contenuti multimediali                 | Supportati, limitati da `mediaMaxMb`        |
| Reazioni                               | Non supportate                             |
| Thread                                 | Non supportati                             |
| Sondaggi                               | Non supportati                             |
| Comandi nativi                         | Non supportati                             |
| Risposta a un messaggio / citazione    | Non utilizzata (disattivata in modo fisso) |

## Destinazioni di consegna (CLI/Cron)

Usa un ID chat come destinazione:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Risoluzione dei problemi

**Il bot non risponde:**

- Controlla il token: `openclaw channels status --probe`
- Verifica che il mittente sia approvato (associazione o `allowFrom`)
- Controlla i log del Gateway: `openclaw logs --follow`

**Il Webhook non riceve eventi:**

- Verifica che l'URL del Webhook usi HTTPS
- Verifica che il segreto contenga da 8 a 256 caratteri
- Verifica che l'endpoint HTTP del Gateway sia raggiungibile nel percorso configurato
- Verifica che il polling `getUpdates` non sia anch'esso in esecuzione (si escludono a vicenda)
- Un picco di richieste può restituire HTTP 429 (120 richieste / 60 s per percorso+IP); attendi e riprova

## Riferimento della configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

| Impostazione                                 | Descrizione                                                         | Valore predefinito      |
| -------------------------------------------- | ------------------------------------------------------------------- | ----------------------- |
| `channels.zalo.enabled`                      | Abilita/disabilita l'avvio del canale                               | `true`                  |
| `channels.zalo.accounts.<id>.botToken`       | Token del bot dalla Zalo Bot Platform                               | -                       |
| `channels.zalo.accounts.<id>.tokenFile`      | Legge il token da un file (i collegamenti simbolici sono rifiutati) | -                       |
| `channels.zalo.accounts.<id>.name`           | Nome visualizzato                                                   | -                       |
| `channels.zalo.accounts.<id>.enabled`        | Abilita/disabilita questo account                                   | `true`                  |
| `channels.zalo.accounts.<id>.dmPolicy`       | Criterio per i messaggi diretti specifico dell'account              | `pairing`               |
| `channels.zalo.accounts.<id>.allowFrom`      | Elenco consentiti per i messaggi diretti (ID utente)                | -                       |
| `channels.zalo.accounts.<id>.groupPolicy`    | Criterio per i gruppi specifico dell'account                        | vedi [Gruppi](#groups)  |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Elenco dei mittenti consentiti nei gruppi; usa `allowFrom`          | -                       |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Limite dei contenuti multimediali in entrata/uscita (MB)            | `5`                     |
| `channels.zalo.accounts.<id>.webhookUrl`     | Abilita la modalità Webhook (HTTPS obbligatorio)                    | -                       |
| `channels.zalo.accounts.<id>.webhookSecret`  | Segreto del Webhook (8-256 caratteri)                               | -                       |
| `channels.zalo.accounts.<id>.webhookPath`    | Percorso del Webhook sul server HTTP del Gateway                    | percorso URL Webhook    |
| `channels.zalo.accounts.<id>.proxy`          | URL del proxy per le richieste API                                  | -                       |
| `channels.zalo.accounts.<id>.responsePrefix` | Sostituzione del prefisso delle risposte in uscita                  | -                       |
| `channels.zalo.defaultAccount`               | Account predefinito quando ne sono configurati più di uno           | `default`               |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` e le altre chiavi piatte di primo livello sono la forma abbreviata legacy per singolo account dei campi precedenti; entrambe le forme sono supportate.

Opzione di ambiente: `ZALO_BOT_TOKEN=...` risolve soltanto il token dell'account predefinito.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e attivazione tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
