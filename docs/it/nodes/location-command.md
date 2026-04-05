---
read_when:
    - Aggiunta del supporto di posizione del nodo o della UI dei permessi
    - Progettazione dei permessi di posizione Android o del comportamento in foreground
summary: Comando posizione per i nodi (`location.get`), modalità di permesso e comportamento in foreground su Android
title: Comando posizione
x-i18n:
    generated_at: "2026-04-05T13:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Comando posizione (nodi)

## In breve

- `location.get` è un comando del nodo (tramite `node.invoke`).
- Disattivato per impostazione predefinita.
- Le impostazioni dell'app Android usano un selettore: Off / While Using.
- Toggle separato: Precise Location.

## Perché un selettore (non solo un interruttore)

I permessi del sistema operativo hanno più livelli. Possiamo esporre un selettore nell'app, ma il sistema operativo decide comunque l'autorizzazione effettiva.

- iOS/macOS possono esporre **While Using** o **Always** nei prompt/impostazioni di sistema.
- L'app Android attualmente supporta solo la posizione in foreground.
- La posizione precisa è un'autorizzazione separata (iOS 14+ “Precise”, Android “fine” vs “coarse”).

Il selettore nella UI controlla la modalità richiesta; l'autorizzazione effettiva risiede nelle impostazioni del sistema operativo.

## Modello delle impostazioni

Per dispositivo nodo:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportamento della UI:

- Selezionare `whileUsing` richiede l'autorizzazione in foreground.
- Se il sistema operativo nega il livello richiesto, torna al livello massimo concesso e mostra lo stato.

## Mappatura dei permessi (`node.permissions`)

Opzionale. Il nodo macOS segnala `location` tramite la mappa dei permessi; iOS/Android possono ometterlo.

## Comando: `location.get`

Chiamato tramite `node.invoke`.

Parametri (consigliati):

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
- `LOCATION_PERMISSION_REQUIRED`: autorizzazione mancante per la modalità richiesta.
- `LOCATION_BACKGROUND_UNAVAILABLE`: l'app è in background, ma è consentito solo While Using.
- `LOCATION_TIMEOUT`: nessun fix ricevuto in tempo.
- `LOCATION_UNAVAILABLE`: errore di sistema / nessun provider disponibile.

## Comportamento in background

- L'app Android nega `location.get` quando è in background.
- Mantieni OpenClaw aperto quando richiedi la posizione su Android.
- Altre piattaforme nodo possono comportarsi diversamente.

## Integrazione con modello/tooling

- Superficie tool: il tool `nodes` aggiunge l'azione `location_get` (nodo richiesto).
- CLI: `openclaw nodes location get --node <id>`.
- Linee guida per l'agente: chiamare solo quando l'utente ha abilitato la posizione e ne comprende l'ambito.

## Testo UX (consigliato)

- Off: “La condivisione della posizione è disabilitata.”
- While Using: “Solo quando OpenClaw è aperto.”
- Precise: “Usa la posizione GPS precisa. Disattiva per condividere una posizione approssimativa.”
