---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o CI
    - È necessaria l'interfaccia di configurazione qa-channel inclusa
    - Stai iterando sull'automazione della garanzia della qualità da un capo all'altro
summary: Plugin di canale sintetico di classe Slack per scenari QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-04-30T08:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` è un trasporto sintetico di messaggi incluso per la QA automatizzata di OpenClaw. Non è un canale di produzione: esiste per esercitare lo stesso confine del Plugin di canale usato dai trasporti reali, mantenendo lo stato deterministico e completamente ispezionabile.

## Cosa fa

- Grammatica dei target di classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetico basato su HTTP per iniettare messaggi in ingresso, acquisire trascrizioni in uscita, creare thread, reazioni, modifiche, eliminazioni e azioni di ricerca/lettura.
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

Chiavi dell’account:

- `enabled` — interruttore principale per questo account.
- `name` — etichetta visualizzata opzionale.
- `baseUrl` — URL del bus sintetico.
- `botUserId` — id utente del bot in stile Matrix usato nella grammatica dei target.
- `botDisplayName` — nome visualizzato per i messaggi in uscita.
- `pollTimeoutMs` — finestra di attesa long-poll. Intero tra 100 e 30000.
- `allowFrom` — elenco consentito dei mittenti (id utente o `"*"`).
- `defaultTo` — target di fallback quando non ne viene fornito nessuno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controllo degli strumenti per singola azione.

Chiavi multi-account al livello superiore:

- `accounts` — record di override denominati per account, indicizzati per id account.
- `defaultAccount` — id account preferito quando ne sono configurati più di uno.

## Runner

Autocontrollo lato host (scrive un report Markdown in `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Passa tramite `qa-lab`, avvia il bus QA nel repository, inizializza la slice runtime `qa-channel` inclusa ed esegue un autocontrollo deterministico.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue gli scenari in parallelo sulla corsia Gateway QA. Consulta [Panoramica QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità provider.

Sito QA basato su Docker (Gateway + UI debugger QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack Gateway + QA Lab basato su Docker e stampa l’URL di QA Lab. Da lì puoi scegliere gli scenari, selezionare la corsia del modello, avviare esecuzioni individuali e guardare i risultati in tempo reale. Il debugger QA Lab è separato dal bundle Control UI distribuito.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) — stack complessivo, adattatori di trasporto, creazione degli scenari
- [QA Matrix](/it/concepts/qa-matrix) — runner di esempio con trasporto live che pilota un canale reale
- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
