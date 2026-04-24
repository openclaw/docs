---
read_when:
    - Aggiunta del supporto Node per la posizione o della UI dei permessi
    - Progettazione dei permessi di posizione Android o del comportamento in foreground
summary: Comando posizione per i Node (`location.get`), modalità dei permessi e comportamento Android in foreground
title: Comando posizione
x-i18n:
    generated_at: "2026-04-24T08:48:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## In breve

- `location.get` è un comando Node (tramite `node.invoke`).
- Disattivato per impostazione predefinita.
- Le impostazioni dell'app Android usano un selettore: Off / While Using.
- Toggle separato: Precise Location.

## Perché un selettore (non solo un interruttore)

I permessi del sistema operativo sono a più livelli. Possiamo esporre un selettore nell'app, ma il sistema operativo decide comunque la concessione effettiva.

- iOS/macOS possono esporre **While Using** o **Always** nei prompt di sistema/nelle Impostazioni.
- L'app Android attualmente supporta solo la posizione in foreground.
- La posizione precisa è una concessione separata (iOS 14+ “Precise”, Android “fine” vs “coarse”).

Il selettore nella UI guida la modalità richiesta; la concessione effettiva risiede nelle impostazioni del sistema operativo.

## Modello delle impostazioni

Per dispositivo Node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento della UI:

- Selezionando `whileUsing` viene richiesta l'autorizzazione in foreground.
- Se il sistema operativo nega il livello richiesto, torna al livello più alto concesso e mostra lo stato.

## Mappatura dei permessi (`node.permissions`)

Facoltativa. Il Node macOS riporta `location` tramite la mappa dei permessi; iOS/Android possono ometterlo.

## Comando: `location.get`

Chiamato tramite `node.invoke`.

Parametri (suggeriti):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload di risposta:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Errori (codici stabili):

- `LOCATION_DISABLED`: il selettore è disattivato.
- `LOCATION_PERMISSION_REQUIRED`: manca il permesso per la modalità richiesta.
- `LOCATION_BACKGROUND_UNAVAILABLE`: l'app è in background ma è consentito solo While Using.
- `LOCATION_TIMEOUT`: nessun fix in tempo.
- `LOCATION_UNAVAILABLE`: errore di sistema / nessun provider.

## Comportamento in background

- L'app Android nega `location.get` quando è in background.
- Tieni OpenClaw aperto quando richiedi la posizione su Android.
- Altre piattaforme Node possono comportarsi in modo diverso.

## Integrazione modello/tooling

- Superficie strumenti: lo strumento `nodes` aggiunge l'azione `location_get` (Node richiesto).
- CLI: `openclaw nodes location get --node <id>`.
- Linee guida per l'agente: chiamare solo quando l'utente ha abilitato la posizione e comprende l'ambito.

## Testo UX (suggerito)

- Off: “La condivisione della posizione è disabilitata.”
- While Using: “Solo quando OpenClaw è aperto.”
- Precise: “Usa la posizione GPS precisa. Disattiva l'opzione per condividere una posizione approssimativa.”

## Correlati

- [Parsing della posizione nei canali](/it/channels/location)
- [Acquisizione della fotocamera](/it/nodes/camera)
- [Modalità Talk](/it/nodes/talk)
