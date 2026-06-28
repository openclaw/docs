---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o in CI
    - È necessaria la superficie di configurazione qa-channel inclusa
    - Stai iterando sull'automazione QA end-to-end
summary: Plugin di canale sintetico di classe Slack per scenari di QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-05-10T19:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`qa-channel` è un trasporto di messaggi sintetico incluso per la QA automatizzata di OpenClaw. Non è un canale di produzione: esiste per esercitare lo stesso confine del Plugin di canale usato dai trasporti reali, mantenendo al tempo stesso lo stato deterministico e completamente ispezionabile.

## Cosa fa

- Grammatica dei target in stile Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Le conversazioni condivise `channel:` e `group:` vengono esposte agli agenti come turni di stanze gruppo/canale, quindi esercitano la stessa policy di routing per risposte visibili e strumenti di messaggistica usata da Discord, Slack, Telegram e trasporti simili.
- Bus sintetico basato su HTTP per iniezione di messaggi in ingresso, acquisizione della trascrizione in uscita, creazione di thread, reazioni, modifiche, eliminazioni e azioni di ricerca/lettura.
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
- `name` - etichetta di visualizzazione opzionale.
- `baseUrl` - URL del bus sintetico.
- `botUserId` - id utente del bot in stile Matrix usato nella grammatica dei target.
- `botDisplayName` - nome visualizzato per i messaggi in uscita.
- `pollTimeoutMs` - finestra di attesa long-poll. Intero tra 100 e 30000.
- `allowFrom` - allowlist dei mittenti (id utente o `"*"`). I messaggi diretti e
  la policy di gruppo con allowlist usano entrambi questi id mittente sintetici.
- `groupPolicy` - policy delle stanze condivise: `"open"` (predefinita), `"allowlist"` o
  `"disabled"`.
- `groupAllowFrom` - allowlist opzionale dei mittenti per le stanze condivise. Quando è omessa con
  `"allowlist"`, QA Channel ripiega su `allowFrom`.
- `groups.<room>.requireMention` - richiede una menzione del bot prima di rispondere in una
  stanza gruppo/canale specifica. `groups."*"` imposta il valore predefinito.
- `defaultTo` - target di fallback quando non ne viene fornito nessuno.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - gating degli strumenti per azione.

Chiavi multi-account al livello superiore:

- `accounts` - record di override per account denominati, indicizzati per id account.
- `defaultAccount` - id account preferito quando ne sono configurati più di uno.

## Runner

Autoverifica lato host (scrive un report Markdown in `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Questo passa attraverso `qa-lab`, avvia il bus QA interno al repository, esegue il boot della slice runtime `qa-channel` inclusa ed esegue un'autoverifica deterministica.

Suite completa di scenari basata sul repository:

```bash
pnpm openclaw qa suite
```

Esegue scenari in parallelo sulla lane del Gateway QA. Vedi [Panoramica QA](/it/concepts/qa-e2e-automation) per scenari, profili e modalità provider.

Sito QA basato su Docker (Gateway + UI del debugger QA Lab in un unico stack):

```bash
pnpm qa:lab:up
```

Compila il sito QA, avvia lo stack Gateway + QA Lab basato su Docker e stampa l'URL di QA Lab. Da lì puoi scegliere scenari, selezionare la lane del modello, avviare esecuzioni individuali e osservare i risultati in tempo reale. Il debugger QA Lab è separato dal bundle Control UI distribuito.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) - stack complessivo, adattatori di trasporto, authoring degli scenari
- [QA Matrix](/it/concepts/qa-matrix) - esempio di runner con trasporto live che pilota un canale reale
- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
