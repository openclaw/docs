---
read_when:
    - Aggiunta del supporto per i nodi di localizzazione o dell'interfaccia utente per le autorizzazioni
    - Progettazione delle autorizzazioni di localizzazione o del comportamento in primo piano su Android
summary: Comando di localizzazione per i Node (location.get), modalità di autorizzazione e comportamento in primo piano su Android
title: Comando di localizzazione
x-i18n:
    generated_at: "2026-07-12T07:13:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## In breve

- `location.get` è un comando del Node, richiamato tramite `node.invoke` o `openclaw nodes location get`.
- Disattivato per impostazione predefinita.
- Le build Android di terze parti usano un selettore: Disattivato / Durante l'uso / Sempre. Le build Play mantengono le opzioni Disattivato / Durante l'uso.
- La posizione precisa dispone di un interruttore separato.

## Perché un selettore (e non un semplice interruttore)

Le autorizzazioni del sistema operativo per la posizione prevedono più livelli. Anche la posizione precisa è un'autorizzazione separata del sistema operativo («Precise» su iOS 14+, «fine» rispetto a «coarse» su Android). Il selettore nell'app determina la modalità richiesta, ma è comunque il sistema operativo a decidere l'autorizzazione effettivamente concessa.

## Modello delle impostazioni

Per ogni dispositivo Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamento dell'interfaccia utente:

- Selezionando `whileUsing` viene richiesta l'autorizzazione in primo piano.
- Selezionando `always` nella build Android di terze parti, viene prima richiesta l'autorizzazione in primo piano, poi viene spiegato l'accesso in background e infine vengono aperte le impostazioni Android dell'app per concedere separatamente **Allow all the time**.
- Le build Android Play non dichiarano l'autorizzazione alla posizione in background e non mostrano `always`.
- Se il sistema operativo nega il livello richiesto, l'app ripristina il livello più elevato concesso e ne mostra lo stato.

## Mappatura delle autorizzazioni (node.permissions)

Facoltativa. Il Node macOS segnala `location` tramite la mappa `permissions` in `node.list`/`node.describe`; iOS/Android potrebbero ometterla.

## Comando: `location.get`

Richiamato tramite `node.invoke` o mediante l'utilità CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parametri:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

I flag della CLI vengono mappati direttamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Payload della risposta:

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
- `LOCATION_PERMISSION_REQUIRED`: manca l'autorizzazione per la modalità richiesta.
- `LOCATION_BACKGROUND_UNAVAILABLE`: l'app è in background, ma è stata concessa solo l'autorizzazione Durante l'uso.
- `LOCATION_TIMEOUT`: posizione non acquisita in tempo.
- `LOCATION_UNAVAILABLE`: errore di sistema o nessun fornitore disponibile.

## Comportamento in background

- Le build Android di terze parti accettano `location.get` in background solo quando l'utente ha selezionato `Always` e Android ha concesso l'accesso alla posizione in background. Il servizio Node persistente esistente aggiunge il tipo di servizio `location` e mostra `Location: Always` mentre è attivo.
- Le build Android Play e la modalità `While Using` negano `location.get` quando l'app è in background.
- Le altre piattaforme Node potrebbero comportarsi diversamente.

## Integrazione con modelli e strumenti

- Strumento dell'agente: l'azione `location_get` dello strumento `nodes` (Node obbligatorio).
- CLI: `openclaw nodes location get --node <id>`.
- Linee guida per l'agente: richiamare solo quando l'utente ha abilitato la posizione e ne comprende l'ambito.

## Testi per l'esperienza utente (suggeriti)

- Disattivato: «La condivisione della posizione è disabilitata».
- Durante l'uso: «Solo quando OpenClaw è aperto».
- Sempre: «Consenti i controlli della posizione richiesti mentre OpenClaw è in background».
- Precisa: «Usa la posizione GPS precisa. Disattiva per condividere una posizione approssimativa».

## Argomenti correlati

- [Panoramica dei Node](/it/nodes)
- [Analisi della posizione nei canali](/it/channels/location)
- [Acquisizione dalla fotocamera](/it/nodes/camera)
- [Modalità conversazione](/it/nodes/talk)
