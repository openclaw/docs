---
read_when:
    - Aggiunta o modifica della parsing delle posizioni dei canali
    - Uso dei campi di contesto della posizione nei prompt o negli strumenti dell'agente
summary: Parsing delle posizioni in ingresso dai canali (Telegram/WhatsApp/Matrix) e campi di contesto
title: Parsing delle posizioni dei canali
x-i18n:
    generated_at: "2026-04-05T13:43:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Parsing delle posizioni dei canali

OpenClaw normalizza le posizioni condivise dai canali di chat in:

- testo leggibile aggiunto al corpo del messaggio in ingresso, e
- campi strutturati nel payload di contesto della risposta automatica.

Attualmente supportati:

- **Telegram** (pin di posizione + luoghi + posizioni in tempo reale)
- **WhatsApp** (`locationMessage + liveLocationMessage`)
- **Matrix** (`m.location` con `geo_uri`)

## Formattazione del testo

Le posizioni vengono rese come righe intuitive senza parentesi quadre:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Luogo con nome:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Condivisione in tempo reale:
  - `🛰 Posizione in tempo reale: 48.858844, 2.294351 ±12m`

Se il canale include una didascalia/commento, viene aggiunto alla riga successiva:

```
📍 48.858844, 2.294351 ±12m
Incontriamoci qui
```

## Campi di contesto

Quando è presente una posizione, questi campi vengono aggiunti a `ctx`:

- `LocationLat` (numero)
- `LocationLon` (numero)
- `LocationAccuracy` (numero, metri; facoltativo)
- `LocationName` (stringa; facoltativo)
- `LocationAddress` (stringa; facoltativo)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)

## Note sui canali

- **Telegram**: i luoghi vengono mappati a `LocationName/LocationAddress`; le posizioni in tempo reale usano `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` vengono aggiunti come riga della didascalia.
- **Matrix**: `geo_uri` viene interpretato come una posizione pin; l'altitudine viene ignorata e `LocationIsLive` è sempre false.
