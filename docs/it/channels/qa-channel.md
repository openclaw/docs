---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o CI
    - Hai bisogno della superficie di configurazione qa-channel inclusa nel pacchetto
    - Stai perfezionando l'automazione del controllo qualità end-to-end
summary: Plugin sintetico per canali di tipo Slack per scenari QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-07-12T06:49:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` è un trasporto sintetico di messaggi locale al repository per il QA automatizzato di OpenClaw (`extensions/qa-channel`, pacchetto privato, escluso dalle installazioni distribuite). Non è un canale di produzione: esiste per esercitare lo stesso confine dei Plugin di canale utilizzato dai trasporti reali, mantenendo al contempo lo stato deterministico e completamente ispezionabile.

## Funzionalità

- Grammatica delle destinazioni analoga a Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Le conversazioni condivise `channel:` e `group:` vengono presentate agli agenti come turni di stanze di gruppo/canale, in modo da esercitare la stessa politica di instradamento delle risposte visibili e degli strumenti di messaggistica utilizzata da Discord, Slack, Telegram e trasporti simili.
- Bus sintetico basato su HTTP per l'iniezione di messaggi in entrata, l'acquisizione delle trascrizioni in uscita, la creazione di thread, le reazioni, le modifiche, le eliminazioni e le azioni di ricerca/lettura.
- Runner di autoverifica lato host che scrive un report Markdown in `.artifacts/qa-e2e/`.

## Configurazione

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Chiavi dell'account:

- `enabled` - interruttore principale per questo account.
- `name` - etichetta di visualizzazione facoltativa.
- `baseUrl` - URL del bus sintetico. L'account viene considerato configurato una volta impostato questo valore.
- `botUserId` - ID utente del bot sintetico utilizzato nella grammatica delle destinazioni (valore predefinito: `openclaw`).
- `botDisplayName` - nome visualizzato per i messaggi in uscita (valore predefinito: `OpenClaw QA`).
- `pollTimeoutMs` - intervallo di attesa del long polling. Numero intero compreso tra 100 e 30000 (valore predefinito: 1000).
- `allowFrom` - elenco consentito dei mittenti (ID utente o `"*"`; valore predefinito: `["*"]`). I messaggi diretti applicano
  sempre la politica `open`; anche la politica di gruppo basata sull'elenco consentito utilizza questi
  ID sintetici dei mittenti.
- `groupPolicy` - politica delle stanze condivise: `"open"` (valore predefinito), `"allowlist"` oppure
  `"disabled"`.
- `groupAllowFrom` - elenco consentito facoltativo dei mittenti delle stanze condivise. Se omesso con
  `"allowlist"`, QA Channel utilizza `allowFrom` come ripiego.
- `groups.<room>.requireMention` - richiede una menzione del bot prima di rispondere in una
  specifica stanza di gruppo/canale (valore predefinito: false). `groups."*"` imposta il valore predefinito;
  `tools` / `toolsBySender` per ciascuna stanza impostano sostituzioni della politica degli strumenti.
- `defaultTo` - destinazione di ripiego quando non ne viene fornita alcuna.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - controllo per azione dell'accesso agli strumenti.

Chiavi multi-account al livello superiore:

- `accounts` - record delle sostituzioni denominate per ciascun account, indicizzate per ID account.
- `defaultAccount` - ID account preferito quando ne sono configurati più di uno.

## Runner

Autoverifica lato host (scrive un report Markdown in `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Il comando instrada l'esecuzione tramite `qa-lab`, avvia il bus QA interno al repository, inizializza la porzione di runtime `qa-channel` ed esegue un'autoverifica deterministica.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue gli scenari in parallelo sulla corsia del Gateway QA. Consulta la [panoramica del QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità dei provider.

Sito QA basato su Docker (Gateway + interfaccia del debugger QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack Gateway + QA Lab basato su Docker e stampa l'URL di QA Lab. Da lì puoi selezionare gli scenari, scegliere la corsia del modello, avviare singole esecuzioni e seguirne i risultati in tempo reale. Il debugger QA Lab è separato dal pacchetto Control UI distribuito.

## Contenuti correlati

- [Panoramica del QA](/it/concepts/qa-e2e-automation) - stack complessivo, adattatori di trasporto, creazione degli scenari
- [QA Matrix](/it/concepts/qa-matrix) - esempio di runner con trasporto reale che controlla un canale effettivo
- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
