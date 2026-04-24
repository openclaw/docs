---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o CI
    - Ti serve la superficie di configurazione del canale qa-channel
    - Stai iterando sull'automazione QA end-to-end
summary: Plugin di canale sintetico di classe Slack per scenari QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-04-24T08:30:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` è un trasporto di messaggi sintetico incluso per la QA automatizzata di OpenClaw.

Non è un canale di produzione. Esiste per esercitare lo stesso confine del plugin di canale
usato dai trasporti reali, mantenendo però lo stato deterministico e completamente
ispezionabile.

## Cosa fa oggi

- Grammatica dei target di classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetico basato su HTTP per:
  - iniezione di messaggi in ingresso
  - acquisizione delle trascrizioni in uscita
  - creazione di thread
  - reazioni
  - modifiche
  - eliminazioni
  - azioni di ricerca e lettura
- Runner di autocontrollo lato host incluso che scrive un report Markdown

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

Chiavi account supportate:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Sezione verticale attuale:

```bash
pnpm qa:e2e
```

Ora questo passa attraverso l'estensione `qa-lab` inclusa. Avvia il
bus QA nel repository, avvia la sezione runtime `qa-channel` inclusa, esegue un
autocontrollo deterministico e scrive un report Markdown in `.artifacts/qa-e2e/`.

Interfaccia debugger privata:

```bash
pnpm qa:lab:up
```

Questo singolo comando compila il sito QA, avvia lo stack Gateway + QA Lab
basato su Docker e stampa l'URL di QA Lab. Da quel sito puoi scegliere gli
scenari, selezionare la corsia del modello, avviare singole esecuzioni e
osservare i risultati in tempo reale.

Suite QA completa supportata dal repository:

```bash
pnpm openclaw qa suite
```

Questo avvia il debugger QA privato su un URL locale, separato dal bundle
dell'interfaccia Control distribuita.

## Ambito

L'ambito attuale è intenzionalmente limitato:

- bus + trasporto del plugin
- grammatica di instradamento con thread
- azioni sui messaggi possedute dal canale
- reportistica Markdown
- sito QA basato su Docker con controlli di esecuzione

Il lavoro successivo aggiungerà:

- esecuzione della matrice provider/modello
- individuazione più ricca degli scenari
- orchestrazione nativa di OpenClaw in seguito

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Panoramica dei canali](/it/channels)
