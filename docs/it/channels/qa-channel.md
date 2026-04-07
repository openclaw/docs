---
read_when:
    - Stai collegando il trasporto QA sintetico a un'esecuzione di test locale o CI
    - Hai bisogno della superficie di configurazione del `qa-channel` incluso
    - Stai iterando sull'automazione QA end-to-end
summary: Plugin di canale sintetico di classe Slack per scenari QA deterministici di OpenClaw
title: Canale QA
x-i18n:
    generated_at: "2026-04-07T08:11:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# Canale QA

`qa-channel` è un trasporto di messaggi sintetico incluso per la QA automatizzata di OpenClaw.

Non è un canale di produzione. Esiste per esercitare lo stesso limite del
plugin di canale usato dai trasporti reali, mantenendo allo stesso tempo lo
stato deterministico e completamente ispezionabile.

## Cosa fa oggi

- Grammatica di destinazione di classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetico supportato da HTTP per:
  - iniezione di messaggi in ingresso
  - acquisizione delle trascrizioni in uscita
  - creazione di thread
  - reazioni
  - modifiche
  - eliminazioni
  - azioni di ricerca e lettura
- Runner di auto-verifica lato host incluso che scrive un report Markdown

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
bus QA nel repository, esegue l'avvio della sezione runtime `qa-channel`
inclusa, esegue un'auto-verifica deterministica e scrive un report Markdown
in `.artifacts/qa-e2e/`.

Interfaccia debugger privata:

```bash
pnpm qa:lab:up
```

Questo singolo comando compila il sito QA, avvia lo stack gateway + QA Lab
basato su Docker e stampa l'URL di QA Lab. Da quel sito puoi selezionare gli
scenari, scegliere la corsia del modello, avviare singole esecuzioni e
osservare i risultati in tempo reale.

Suite QA completa supportata dal repository:

```bash
pnpm openclaw qa suite
```

Questo avvia il debugger QA privato a un URL locale, separato dal bundle della
Control UI distribuito.

## Ambito

L'ambito attuale è intenzionalmente ristretto:

- bus + trasporto plugin
- grammatica di instradamento con thread
- azioni sui messaggi gestite dal canale
- reportistica Markdown
- sito QA basato su Docker con controlli di esecuzione

I lavori successivi aggiungeranno:

- esecuzione della matrice provider/modello
- individuazione degli scenari più ricca
- orchestrazione nativa OpenClaw in seguito
