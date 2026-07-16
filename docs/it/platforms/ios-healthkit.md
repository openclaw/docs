---
read_when:
    - Abilitazione dei riepiloghi di HealthKit su un nodo iPhone
    - Richiamo di health.summary o risoluzione dei problemi relativi alle metriche di integrità mancanti
    - Verifica dei dati sanitari che possono lasciare un iPhone
summary: Abilitare e richiamare i riepiloghi di HealthKit soggetti a controlli di privacy da un nodo iPhone
title: Riepiloghi di HealthKit
x-i18n:
    generated_at: "2026-07-16T14:34:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Riepiloghi HealthKit

OpenClaw può richiedere a un nodo iPhone connesso un riepilogo in sola lettura del giorno di calendario corrente. L'iPhone calcola l'aggregato sul dispositivo e restituisce solo il numero di passi, la durata del sonno, la frequenza cardiaca media a riposo e il numero e la durata degli allenamenti. Non sono supportati singoli campioni HealthKit, fonti, metadati, cartelle cliniche, acquisizione in background e operazioni di scrittura.

Questa funzionalità è disattivata per impostazione predefinita. Richiede un consenso separato sull'iPhone e l'autorizzazione sul Gateway.

## Requisiti

- Un iPhone su cui è in esecuzione l'app OpenClaw per iOS e in cui HealthKit indica che i dati sanitari sono disponibili.
- Un nodo iPhone connesso e approvato. Consultare [Configurazione dell'app iOS](/it/platforms/ios).
- Un Gateway aggiornato in grado di raggiungere il nodo iPhone.
- Dati di Salute leggibili per tutte le metriche che si prevede di visualizzare. Un Apple Watch può fornire dati all'archivio Salute dell'iPhone, ma l'app OpenClaw per watchOS non è necessaria per i riepiloghi HealthKit.

## Abilitare l'accesso

### 1. Autorizzare il comando del Gateway

Aggiungere `health.summary` all'array `gateway.nodes.allowCommands` esistente in `openclaw.json`. Conservare tutti i comandi già presenti:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` è classificato come particolarmente sensibile per la privacy e non è mai consentito dalle impostazioni predefinite della piattaforma iOS. Una voce in `gateway.nodes.denyCommands` prevale sulla voce di autorizzazione. Consultare [Criteri dei comandi dei nodi](/it/nodes#command-policy).

### 2. Abilitare la condivisione sull'iPhone

Nell'app iOS:

1. Aprire **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Toccare **Enable & Share Summaries**.
3. Leggere l'informativa, quindi scegliere le categorie di Salute che OpenClaw può leggere nella schermata delle autorizzazioni di Apple.

L'interruttore registra la scelta esplicita di condividere i dati con OpenClaw. Non indica che Apple abbia concesso l'accesso a tutte le categorie richieste.

L'abilitazione dei riepiloghi di Salute aggiunge `health.summary` alla superficie dei comandi dichiarati dal nodo. Approvare il conseguente aggiornamento dell'associazione del nodo:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Verificare quindi che l'iPhone connesso esponga un comando `health.summary` effettivo:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Richiedere il riepilogo di oggi

È supportato solo `today`. Copre l'intervallo dalla mezzanotte locale al momento della richiesta, utilizzando il calendario e il fuso orario correnti dell'iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Gli agenti possono chiamare lo stesso comando con lo strumento `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Il payload del riepilogo contiene:

| Campo                    | Significato                                       |
| ------------------------ | --------------------------------------------- |
| `period`                 | Sempre `today`                                |
| `startISO`               | Inizio locale del giorno, codificato come istante ISO |
| `endISO`                 | Ora della richiesta, codificata come istante ISO       |
| `timeZoneIdentifier`     | Identificatore del fuso orario dell'iPhone                   |
| `stepCount`              | Passi cumulativi arrotondati                      |
| `sleepDurationMinutes`   | Tempo di sonno deduplicato, limitato alla giornata odierna    |
| `restingHeartRateBpm`    | Frequenza cardiaca media a riposo                    |
| `workoutCount`           | Allenamenti iniziati oggi                   |
| `workoutDurationMinutes` | Durata totale di tali allenamenti              |

I campi delle metriche sono facoltativi e vengono omessi quando HealthKit non restituisce alcun valore leggibile. Le fasi del sonno e le fonti sovrapposte vengono unite prima del calcolo della durata, in modo che lo stesso minuto non venga conteggiato due volte.

## Comportamento relativo alla privacy

- L'aggregazione avviene sull'iPhone. I campioni non elaborati non lasciano il dispositivo.
- L'aggregato richiesto lascia l'iPhone attraverso il Gateway. Quando viene richiesto da un agente, l'aggregato raggiunge il provider di IA configurato e può rimanere nella cronologia della chat. Un'invocazione diretta dalla CLI lo restituisce all'operatore della CLI.
- OpenClaw richiede esclusivamente l'accesso in lettura. Non può aggiungere o modificare dati di Salute.
- OpenClaw legge HealthKit solo quando viene invocato `health.summary`. Non viene eseguita alcuna acquisizione di dati sanitari in background.
- HealthKit non rivela intenzionalmente se l'accesso in lettura è stato negato. Una metrica mancante può indicare un accesso negato, l'assenza di campioni corrispondenti o un tipo di dati non disponibile. OpenClaw non può distinguere questi casi.
- Il riepilogo è destinato al contesto personale di salute e forma fisica, non alla diagnosi o alla consulenza medica.

Per interrompere la condivisione, tornare a **Health Summaries** e toccare **Disable**. L'iPhone rimuoverà quindi la funzionalità Salute e il comando `health.summary` dalla superficie del nodo. È inoltre possibile rimuovere `health.summary` da `gateway.nodes.allowCommands` per chiudere il controllo di accesso sul lato Gateway.

## Risoluzione dei problemi

### Il comando non è dichiarato dal nodo

Verificare che i riepiloghi di Salute siano abilitati nell'app iOS e che l'iPhone sia connesso. Eseguire `openclaw nodes pending` e approvare eventuali aggiornamenti delle funzionalità, quindi esaminare nuovamente `openclaw nodes describe --node "<iPhone name>"`.

### Il comando richiede un consenso esplicito

Aggiungere `health.summary` a `gateway.nodes.allowCommands`. Verificare inoltre che `gateway.nodes.denyCommands` non lo contenga; l'elenco di negazione ha la precedenza.

### `HEALTH_ACCESS_DISABLED`

L'interruttore di condivisione nell'app è disattivato. Abilitare **Health Summaries** in **Privacy & Access** sull'iPhone.

### Il riepilogo riesce, ma mancano alcune metriche

Aprire l'app Salute di Apple e verificare che siano presenti dati relativi alla giornata odierna. Controllare l'accesso di OpenClaw nelle impostazioni di Salute di Apple, ma non considerare un risultato vuoto come prova che l'accesso sia stato negato: HealthKit nasconde intenzionalmente tale distinzione.

### Gli intervalli precedenti non funzionano

Il comando accetta solo `{"period":"today"}`. I riepiloghi su più giorni e quelli storici non sono supportati.

## Voci correlate

- [App iOS](/it/platforms/ios)
- [Nodi](/it/nodes)
- [Riferimento per la configurazione del Gateway](/it/gateway/configuration-reference#gateway)
- [Controllo di sicurezza](/it/gateway/security)
