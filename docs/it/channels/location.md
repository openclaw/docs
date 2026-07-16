---
read_when:
    - Aggiunta o modifica dell'analisi della posizione del canale
    - Utilizzo dei campi di contesto della posizione nei prompt o negli strumenti dell'agente
summary: Analisi della posizione del canale e payload di posizione in uscita portabili
title: Analisi della posizione del canale
x-i18n:
    generated_at: "2026-07-16T13:50:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normalizza le posizioni condivise dai canali di chat in:

- testo conciso con le coordinate aggiunto al corpo in entrata e
- campi strutturati nel payload di contesto della risposta automatica. Le etichette, gli indirizzi e le didascalie/i commenti forniti dal canale vengono inseriti nel prompt tramite il blocco JSON condiviso dei metadati non attendibili, non direttamente nel corpo dell'utente.

Attualmente supportati:

- **LINE** (messaggi di posizione con titolo/indirizzo)
- **Matrix** (`m.location` con `geo_uri`)
- **Telegram** (segnaposto di posizione + luoghi + posizioni in tempo reale)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Formattazione del testo

Le posizioni vengono visualizzate come righe leggibili senza parentesi. Le coordinate usano sei cifre decimali; la precisione viene arrotondata al metro intero:

- Segnaposto:
  - `📍 48.858844, 2.294351 ±12m`
- Luogo denominato (sulla stessa riga; il nome/indirizzo viene inserito solo nel blocco dei metadati):
  - `📍 48.858844, 2.294351 ±12m`
- Condivisione in tempo reale:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Se il canale include un'etichetta, un indirizzo o una didascalia/un commento, questi vengono conservati nel payload di contesto e appaiono nel prompt come JSON non attendibile delimitato (i campi vengono omessi quando assenti):

````text
Posizione (metadati non attendibili):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Torre Eiffel",
  "address": "Campo di Marte, Parigi",
  "caption": "Incontriamoci qui"
}
```
````

## Campi del contesto

Quando è presente una posizione, questi campi vengono aggiunti a `ctx`:

- `LocationLat` (numero)
- `LocationLon` (numero)
- `LocationAccuracy` (numero, metri; facoltativo)
- `LocationName` (stringa; facoltativo)
- `LocationAddress` (stringa; facoltativo)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)
- `LocationCaption` (stringa; facoltativo)

Quando il canale non imposta una sorgente esplicita, OpenClaw la deduce: le condivisioni in tempo reale diventano `live`, le posizioni con un nome o un indirizzo diventano `place`, tutte le altre sono `pin`.

Il renderer del prompt tratta `LocationName`, `LocationAddress` e `LocationCaption` come metadati non attendibili e li serializza tramite lo stesso percorso JSON con limiti usato per gli altri dati di contesto del canale.

## Payload in uscita

Lo strumento per i messaggi e l'SDK del Plugin usano la stessa struttura `NormalizedLocation` per le posizioni portabili in uscita. Un payload contenente solo le coordinate rappresenta un segnaposto. I canali con supporto nativo per i luoghi possono associare `name` più `address` a una scheda del luogo.

Attualmente Telegram espone questa funzionalità tramite `message(action="send")`. La sua prima implementazione è volutamente autonoma: i payload di posizione non possono essere combinati con testo o contenuti multimediali e le coppie di dati del luogo incomplete generano un errore anziché eliminare silenziosamente un nome o un indirizzo. I canali non supportati non dichiarano il parametro di posizione.

## Note sui canali

- **LINE**: i campi `title`/`address` del messaggio di posizione vengono associati a `LocationName`/`LocationAddress`; le posizioni in tempo reale non sono supportate.
- **Matrix**: `geo_uri` viene analizzato come posizione di un segnaposto; il parametro `u` (incertezza) viene associato a `LocationAccuracy`, il corpo dell'evento popola `LocationCaption`, l'altitudine viene ignorata e `LocationIsLive` è sempre falso.
- **Telegram**: i luoghi vengono associati a `LocationName`/`LocationAddress`; le posizioni in tempo reale vengono rilevate tramite `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` popolano `LocationCaption`.

## Argomenti correlati

- [Comando di posizione (nodi)](/it/nodes/location-command)
- [Acquisizione dalla fotocamera](/it/nodes/camera)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
