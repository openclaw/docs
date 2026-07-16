---
read_when:
    - Aggiunta del supporto del Node per la posizione o dell'interfaccia utente per le autorizzazioni
    - Progettazione delle autorizzazioni di localizzazione o del comportamento in primo piano su Android
summary: Comando di localizzazione per i Node, modalità di autorizzazione della piattaforma e configurazione di GeoClue su Linux
title: Comando di posizione
x-i18n:
    generated_at: "2026-07-16T14:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## In breve

- `location.get` è un comando del Node, richiamato tramite `node.invoke` o `openclaw nodes location get`.
- Disattivato per impostazione predefinita.
- Le build Android di terze parti usano un selettore: Disattivato / Durante l'uso / Sempre. Le build Play mantengono le opzioni Disattivato / Durante l'uso.
- La posizione precisa dispone di un interruttore separato.

## Perché un selettore (e non un semplice interruttore)

Le autorizzazioni di localizzazione del sistema operativo prevedono più livelli. Anche la posizione precisa è un'autorizzazione distinta del sistema operativo («Precisa» su iOS 14+, «fine» rispetto ad «approssimativa» su Android). Il selettore nell'app determina la modalità richiesta, ma è comunque il sistema operativo a decidere l'autorizzazione effettivamente concessa.

## Modello delle impostazioni

Per ciascun dispositivo Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Comportamento dell'interfaccia:

- Selezionando `whileUsing` viene richiesta l'autorizzazione in primo piano.
- Selezionando `always` nella build Android di terze parti, viene prima richiesta l'autorizzazione in primo piano, quindi viene spiegato l'accesso in background e infine vengono aperte le impostazioni dell'app Android per concedere separatamente **Allow all the time**.
- Le build Android Play non dichiarano l'autorizzazione per la localizzazione in background e non mostrano `always`.
- Se il sistema operativo nega il livello richiesto, l'app ripristina il livello più alto concesso e ne mostra lo stato.

## Mappatura delle autorizzazioni (node.permissions)

Facoltativa. Il Node macOS segnala `location` tramite la mappa `permissions` in `node.list`/`node.describe`; iOS e Android potrebbero ometterlo.

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

I flag CLI vengono mappati direttamente: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: l'app è in background, ma è stata concessa soltanto l'autorizzazione Durante l'uso.
- `LOCATION_TIMEOUT`: posizione non acquisita in tempo.
- `LOCATION_UNAVAILABLE`: errore di sistema o nessun provider disponibile.

## Comportamento in background

- Le build Android di terze parti accettano `location.get` in background solo quando è stata selezionata l'opzione `Always` e Android ha concesso la localizzazione in background. Il servizio Node persistente esistente aggiunge il tipo di servizio `location` e indica `Location: Always` mentre è attivo.
- Le build Android Play e la modalità `While Using` negano `location.get` mentre l'app è in background.
- Le altre piattaforme Node possono comportarsi diversamente.

## Host Node Linux

Il Plugin Node Linux incluso aggiunge `location.get` al servizio CLI `openclaw node`, inclusi gli host headless privi dell'app desktop Linux. La localizzazione è disattivata per impostazione predefinita. Abilitarla nella voce del Plugin, quindi riavviare il servizio Node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Installare GeoClue2 e la relativa demo `where-am-i` (`geoclue-2-demo` su Debian e Ubuntu). L'utente del servizio Node deve essere autorizzato dai criteri GeoClue dell'host e dall'agente di autorizzazione.

Il Plugin usa `where-am-i` anziché una sequenza di chiamate `busctl`. GeoClue associa la creazione del client, le proprietà, l'avvio, gli aggiornamenti e l'arresto a una singola connessione client D-Bus; la demo mantiene unito questo ciclo di vita, mentre i sottoprocessi `busctl` separati non lo fanno. Non viene aggiunta alcuna dipendenza npm.

Linux mappa `coarse`, `balanced` e `precise` sui livelli di precisione GeoClue `4`, `6` e `8`. Convalida `maxAgeMs` rispetto al timestamp restituito. La demo di GeoClue non espone il provider selezionato, quindi `source` è `unknown`; `isPrecise` è true solo quando la precisione indicata è pari o inferiore a 100 metri.

Linux usa gli stessi errori stabili: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` e `LOCATION_UNAVAILABLE`.

## Integrazione con modelli e strumenti

- Strumento dell'agente: l'azione `location_get` dello strumento `nodes` (Node richiesto).
- CLI: `openclaw nodes location get --node <id>`.
- Linee guida per l'agente: effettuare la chiamata solo quando l'utente ha abilitato la localizzazione e ne comprende l'ambito.

## Testi dell'interfaccia (suggeriti)

- Disattivato: «La condivisione della posizione è disabilitata».
- Durante l'uso: «Solo quando OpenClaw è aperto».
- Sempre: «Consenti i controlli della posizione richiesti mentre OpenClaw è in background».
- Precisa: «Usa la posizione GPS precisa. Disattivare l'opzione per condividere la posizione approssimativa».

## Argomenti correlati

- [Panoramica dei Node](/it/nodes)
- [Analisi della posizione nei canali](/it/channels/location)
- [Acquisizione dalla fotocamera](/it/nodes/camera)
- [Modalità conversazione](/it/nodes/talk)
