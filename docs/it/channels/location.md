---
read_when:
    - Aggiunta o modifica dell'analisi della posizione del canale
    - Utilizzo dei campi di contesto della posizione nei prompt dell'agente o negli strumenti
summary: Analisi della posizione del canale in ingresso (Telegram/WhatsApp/Matrix) e campi di contesto
title: Analisi della posizione del canale
x-i18n:
    generated_at: "2026-04-24T08:30:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
---

OpenClaw normalizza le posizioni condivise dai canali di chat in:

- testo conciso con coordinate aggiunto al corpo in ingresso, e
- campi strutturati nel payload di contesto della risposta automatica. Le etichette, gli indirizzi e le didascalie/commenti forniti dal canale vengono resi nel prompt tramite il blocco JSON condiviso di metadati non attendibili, non inline nel corpo dell'utente.

Attualmente supportato:

- **Telegram** (pin di posizione + luoghi + posizioni in tempo reale)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` con `geo_uri`)

## Formattazione del testo

Le posizioni vengono visualizzate come righe leggibili senza parentesi:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Luogo con nome:
  - `📍 48.858844, 2.294351 ±12m`
- Condivisione in tempo reale:
  - `🛰 Posizione in tempo reale: 48.858844, 2.294351 ±12m`

Se il canale include un'etichetta, un indirizzo o una didascalia/commento, questi vengono mantenuti nel payload di contesto e compaiono nel prompt come JSON non attendibile delimitato:

````text
Posizione (metadati non attendibili):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Torre Eiffel",
  "address": "Champ de Mars, Parigi",
  "caption": "Incontriamoci qui"
}
```
````

## Campi di contesto

Quando è presente una posizione, questi campi vengono aggiunti a `ctx`:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, metri; facoltativo)
- `LocationName` (string; facoltativo)
- `LocationAddress` (string; facoltativo)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; facoltativo)

Il renderer del prompt tratta `LocationName`, `LocationAddress` e `LocationCaption` come metadati non attendibili e li serializza tramite lo stesso percorso JSON delimitato usato per gli altri contesti di canale.

## Note sui canali

- **Telegram**: i luoghi vengono mappati a `LocationName/LocationAddress`; le posizioni in tempo reale usano `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` popolano `LocationCaption`.
- **Matrix**: `geo_uri` viene analizzato come posizione pin; l'altitudine viene ignorata e `LocationIsLive` è sempre false.

## Correlati

- [Comando di posizione (Node)](/it/nodes/location-command)
- [Acquisizione fotocamera](/it/nodes/camera)
- [Comprensione dei media](/it/nodes/media-understanding)
