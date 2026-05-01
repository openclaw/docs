---
read_when:
    - Stai integrando il trasporto QA sintetico in un'esecuzione di test locale o CI
    - È necessaria la superficie di configurazione qa-channel inclusa
    - Stai iterando sull'automazione del controllo qualità da inizio a fine
summary: Plugin di canale sintetico di classe Slack per scenari di QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-05-01T08:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` è un trasporto sintetico di messaggi incluso per la QA automatizzata di OpenClaw. Non è un canale di produzione: esiste per esercitare lo stesso confine del Plugin di canale usato dai trasporti reali, mantenendo al contempo lo stato deterministico e completamente ispezionabile.

## Cosa fa

- Grammatica dei target di classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Le conversazioni condivise `channel:` e `group:` vengono esposte agli agenti come turni di stanza gruppo/canale, quindi esercitano gli stessi criteri di instradamento delle risposte visibili e degli strumenti di messaggistica usati da Discord, Slack, Telegram e trasporti simili.
- Bus sintetico basato su HTTP per l’iniezione di messaggi in ingresso, l’acquisizione delle trascrizioni in uscita, la creazione di thread, reazioni, modifiche, eliminazioni e azioni di ricerca/lettura.
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

Chiavi account:

- `enabled` — interruttore principale per questo account.
- `name` — etichetta di visualizzazione facoltativa.
- `baseUrl` — URL del bus sintetico.
- `botUserId` — ID utente del bot in stile Matrix usato nella grammatica dei target.
- `botDisplayName` — nome visualizzato per i messaggi in uscita.
- `pollTimeoutMs` — finestra di attesa del long-poll. Intero tra 100 e 30000.
- `allowFrom` — lista consentiti dei mittenti (ID utente o `"*"`).
- `defaultTo` — target di fallback quando non ne viene fornito uno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controllo di accesso agli strumenti per azione.

Chiavi multi-account al livello superiore:

- `accounts` — record delle sostituzioni denominate per account indicizzate per ID account.
- `defaultAccount` — ID account preferito quando ne sono configurati più di uno.

## Runner

Autoverifica lato host (scrive un report Markdown sotto `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Questo passa attraverso `qa-lab`, avvia il bus QA nel repository, esegue la porzione di runtime `qa-channel` inclusa ed esegue un’autoverifica deterministica.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue scenari in parallelo sulla corsia del Gateway QA. Vedi [panoramica QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità dei provider.

Sito QA basato su Docker (Gateway + interfaccia debugger QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack Gateway + QA Lab basato su Docker e stampa l’URL di QA Lab. Da lì puoi scegliere scenari, selezionare la corsia del modello, avviare esecuzioni singole e osservare i risultati in tempo reale. Il debugger QA Lab è separato dal bundle Control UI distribuito.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) — stack complessivo, adattatori di trasporto, creazione di scenari
- [QA Matrix](/it/concepts/qa-matrix) — runner di esempio per trasporto live che controlla un canale reale
- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
