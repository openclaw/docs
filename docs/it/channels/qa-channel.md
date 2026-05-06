---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o in CI
    - È necessaria la superficie di configurazione qa-channel inclusa
    - Stai iterando sull'automazione del controllo qualità da inizio a fine
summary: Plugin di canale sintetico di classe Slack per scenari di QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-05-06T08:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` è un trasporto di messaggi sintetico incluso per la QA automatizzata di OpenClaw. Non è un canale di produzione: esiste per esercitare lo stesso confine del Plugin di canale usato dai trasporti reali mantenendo lo stato deterministico e completamente ispezionabile.

## Cosa fa

- Grammatica di destinazione di classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Le conversazioni condivise `channel:` e `group:` vengono esposte agli agenti come turni di stanza gruppo/canale, quindi esercitano la stessa policy di risposta visibile e instradamento dello strumento messaggi usata da Discord, Slack, Telegram e trasporti simili.
- Bus sintetico basato su HTTP per l'iniezione di messaggi in ingresso, la cattura delle trascrizioni in uscita, la creazione di thread, reazioni, modifiche, eliminazioni e azioni di ricerca/lettura.
- Runner di autocontrollo lato host che scrive un report Markdown in `.artifacts/qa-e2e/`.

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

Chiavi account:

- `enabled` - interruttore principale per questo account.
- `name` - etichetta di visualizzazione opzionale.
- `baseUrl` - URL del bus sintetico.
- `botUserId` - ID utente bot in stile Matrix usato nella grammatica di destinazione.
- `botDisplayName` - nome visualizzato per i messaggi in uscita.
- `pollTimeoutMs` - finestra di attesa long-poll. Intero tra 100 e 30000.
- `allowFrom` - allowlist dei mittenti (ID utente o `"*"`).
- `defaultTo` - destinazione di fallback quando non ne viene fornita alcuna.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - controllo dell'accesso agli strumenti per azione.

Chiavi multi-account al livello superiore:

- `accounts` - record di override per account nominati indicizzati per ID account.
- `defaultAccount` - ID account preferito quando ne sono configurati più di uno.

## Runner

Autocontrollo lato host (scrive un report Markdown sotto `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Questo passa attraverso `qa-lab`, avvia il bus QA interno al repository, inizializza il segmento runtime `qa-channel` incluso ed esegue un autocontrollo deterministico.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue gli scenari in parallelo contro la lane QA del Gateway. Vedi [Panoramica QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità provider.

Sito QA basato su Docker (Gateway + UI debugger di QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack Gateway + QA Lab basato su Docker e stampa l'URL di QA Lab. Da lì puoi scegliere gli scenari, selezionare la lane del modello, avviare singole esecuzioni e osservare i risultati in tempo reale. Il debugger di QA Lab è separato dal bundle Control UI distribuito.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) - stack complessivo, adattatori di trasporto, creazione degli scenari
- [QA Matrix](/it/concepts/qa-matrix) - esempio di runner con trasporto live che pilota un canale reale
- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica canali](/it/channels)
