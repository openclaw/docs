---
read_when:
    - Si sta integrando il trasporto QA sintetico in un'esecuzione di test locale o CI
    - È necessaria l'interfaccia di configurazione qa-channel inclusa nel bundle
    - Si sta perfezionando l'automazione QA end-to-end
summary: Plugin di canale sintetico di classe Slack per scenari QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-07-16T14:02:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` è un trasporto sintetico di messaggi locale al repository per la QA automatizzata di OpenClaw (`extensions/qa-channel`, pacchetto privato, escluso dalle installazioni pacchettizzate). Non è un canale di produzione: esiste per esercitare lo stesso confine del plugin di canale usato dai trasporti reali, mantenendo al contempo lo stato deterministico e completamente ispezionabile.

## Funzionalità

- Grammatica delle destinazioni analoga a Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Le conversazioni condivise `channel:` e `group:` vengono presentate agli agenti come turni di stanze di gruppo/canale, così da esercitare la stessa politica di instradamento delle risposte visibili e degli strumenti di messaggistica usata da Discord, Slack, Telegram e trasporti simili.
- Bus sintetico basato su HTTP per l'inserimento di messaggi in entrata, l'acquisizione delle trascrizioni in uscita, la creazione di thread, le reazioni, le modifiche, le eliminazioni e le azioni di ricerca/lettura.
- Esecutore di autocontrollo lato host che scrive un report Markdown in `.artifacts/qa-e2e/`.

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
- `botUserId` - ID utente del bot sintetico usato nella grammatica delle destinazioni (valore predefinito: `openclaw`).
- `botDisplayName` - nome visualizzato per i messaggi in uscita (valore predefinito: `OpenClaw QA`).
- `pollTimeoutMs` - intervallo di attesa del long polling. Numero intero compreso tra 100 e 30000 (valore predefinito: 1000).
- `allowFrom` - elenco dei mittenti consentiti (ID utente o `"*"`; valore predefinito: `["*"]`). I messaggi diretti usano
  sempre la politica `open`; anche la politica dei gruppi con elenco dei mittenti consentiti usa questi ID
  sintetici dei mittenti.
- `groupPolicy` - politica delle stanze condivise: `"open"` (valore predefinito), `"allowlist"` oppure
  `"disabled"`.
- `groupAllowFrom` - elenco facoltativo dei mittenti consentiti nelle stanze condivise. Se omesso con
  `"allowlist"`, QA Channel usa come ripiego `allowFrom`.
- `groups.<room>.requireMention` - richiede una menzione del bot prima di rispondere in una
  specifica stanza di gruppo/canale (valore predefinito: false). `groups."*"` imposta il valore predefinito;
  `tools` / `toolsBySender` per stanza impostano le sostituzioni della politica degli strumenti.
- `defaultTo` - destinazione di ripiego quando non ne viene fornita alcuna.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - controllo dell'accesso agli strumenti per singola azione.

Chiavi multi-account al livello principale:

- `accounts` - record delle sostituzioni denominate per singolo account, indicizzate per ID account.
- `defaultAccount` - ID account preferito quando ne sono configurati più di uno.

## Esecutori

Autocontrollo lato host (scrive un report Markdown in `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

L'operazione viene instradata tramite `qa-lab`, avvia il bus QA interno al repository, inizializza la porzione di runtime `qa-channel` ed esegue un autocontrollo deterministico.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue gli scenari in parallelo sulla corsia del Gateway QA. Consultare la [panoramica della QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità dei provider.

Sito QA basato su Docker (Gateway + interfaccia di debug di QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack basato su Docker con Gateway + QA Lab e mostra l'URL di QA Lab. Da lì è possibile selezionare gli scenari, scegliere la corsia del modello, avviare singole esecuzioni e osservare i risultati in tempo reale. Il debugger di QA Lab è separato dal bundle della Control UI distribuito.

## Contenuti correlati

- [Panoramica della QA](/it/concepts/qa-e2e-automation) - stack complessivo, adattatori di trasporto, profili Matrix e creazione degli scenari
- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
