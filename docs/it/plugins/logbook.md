---
read_when:
    - Vuoi una cronologia della tua giornata in stile Dayflow nell'interfaccia di controllo
    - Stai abilitando o configurando il plugin Logbook incluso nel pacchetto
    - Vuoi riepiloghi per lo stand-up o ricostruzioni della giornata basati sull'attività sullo schermo
summary: Diario di lavoro automatico opzionale creato a partire da istantanee periodiche dello schermo
title: Plugin del registro di attività
x-i18n:
    generated_at: "2026-07-12T07:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Il Plugin Logbook trasforma l'attività sullo schermo in un diario di lavoro automatico. Acquisisce
istantanee periodiche dello schermo da un Node associato, le riassume in
osservazioni con indicazione temporale e crea schede cronologiche nella
[UI di controllo](/it/web/control-ui). Può inoltre generare note per il resoconto giornaliero e
rispondere a domande su una giornata monitorata.

Lo stato gestito da OpenClaw rimane nel Gateway, in `<state-dir>/logbook/`, ma
l'elaborazione del modello non avviene necessariamente in locale. Le schermate campionate vengono inviate al
percorso di visione configurato; le osservazioni e il testo della cronologia vengono inviati al modello
predefinito dell'agente. Usa percorsi di modelli locali per entrambe le fasi se il contenuto dello schermo e
il testo derivato dell'attività devono rimanere sul computer.

Logbook è incluso e disabilitato per impostazione predefinita. L'abilitazione del Plugin consente al
Gateway di acquisire lo schermo, poiché il valore predefinito di `captureEnabled` è `true`.

## Prima di iniziare

Sono necessari:

- Un Node connesso che esponga `screen.snapshot` o `logbook.snapshot`. Il
  Node dell'app macOS richiede l'autorizzazione Registrazione schermo. Un host Node macOS headless
  (`openclaw node host run`) riceve il comando `logbook.snapshot`
  fornito dal Plugin e basato sullo strumento di sistema `screencapture`.
- Il Plugin Codex incluso, abilitato e autenticato. Attualmente Codex fornisce
  il contratto di estrazione strutturata delle immagini richiesto da Logbook. Accedi con
  `openclaw models auth login --provider openai`; consulta
  [Harness Codex](/it/plugins/codex-harness) per altri metodi di autenticazione.
- Un modello predefinito dell'agente funzionante. Logbook lo usa per sintetizzare schede, note
  per il resoconto e domande e risposte sulla giornata dopo l'elaborazione visiva.

## Avvio rapido

Abilita i Plugin Codex e Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configura un modello di visione esplicito per un avvio deterministico:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Se usi `plugins.allow`, includi sia `codex` sia `logbook`. Riavvia il
Gateway dopo aver modificato la configurazione dei Plugin, quindi esamina le registrazioni
e apri il pannello di controllo:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La descrizione del Node deve includere `screen.snapshot` o `logbook.snapshot`.
I Node headless pubblicizzano `logbook.snapshot` solo dopo l'attivazione del Plugin.
Consulta [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting) se il comando non è presente.

La scheda Logbook viene visualizzata solo quando il Plugin è abilitato e la sessione della
UI di controllo dispone di `operator.write`. La riga di stato dovrebbe mostrare **Acquisizione in corso** senza errori.
Una scheda della cronologia viene visualizzata alla chiusura della finestra di analisi; in alternativa, puoi selezionare
**Analizza ora** dopo l'acquisizione dell'attività.

## Funzionamento

1. **Acquisizione**: ogni `captureIntervalSeconds` (valore predefinito: 30 secondi), Logbook richiama
   il comando di acquisizione del Node selezionato e archivia un fotogramma JPEG ridimensionato.
   I fotogrammi consecutivi identici vengono contrassegnati come inattivi ed esclusi dall'analisi.
2. **Osservazione**: una volta trascorsa una finestra di analisi (valore predefinito: 15 minuti), il
   Plugin campiona fino a 16 fotogrammi attivi e li invia al modello di visione,
   che restituisce osservazioni sull'attività con indicazione temporale ("VS Code: modifica di
   store.ts, correzione di un errore di tipo"). Anche un'interruzione dell'acquisizione superiore a due minuti o
   la mezzanotte locale chiudono la finestra corrente.
3. **Sintesi**: le osservazioni e le schede esistenti degli ultimi 45 minuti vengono
   rielaborate in schede della cronologia (ciascuna di 10-60 minuti) con titolo, riepilogo,
   categoria, app principale ed eventuali brevi distrazioni.
4. **Eliminazione**: i fotogrammi più vecchi di `retentionDays` (valore predefinito: 14) vengono eliminati.
   Le schede, le osservazioni e i resoconti memorizzati nella cache vengono conservati.

I confini delle giornate e gli orari della cronologia usano il fuso orario locale del Gateway, non quello
del browser. I fotogrammi e il database SQLite della cronologia si trovano in
`<state-dir>/logbook/`.

## Flusso dei modelli e dei dati

Logbook usa due percorsi di modelli distinti:

| Fase             | Dati inviati                                                | Percorso del modello                                                |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Osservazione     | Fino a 16 fotogrammi JPEG campionati e relativi orari di acquisizione | `visionModel` o una voce Codex `tools.media` compatibile presa in prestito |
| Sintesi schede   | Osservazioni con indicazione temporale e schede recenti della cronologia | Modello predefinito dell'agente tramite il runtime LLM del Plugin    |
| Generazione resoconto | Schede del giorno selezionato e del giorno precedente  | Modello predefinito dell'agente tramite il runtime LLM del Plugin    |
| Domande sulla giornata | Domanda, schede del giorno selezionato e osservazioni recenti | Modello predefinito dell'agente tramite il runtime LLM del Plugin |

Il database SQLite completo non viene inviato ad alcun modello. Le schermate grezze vengono inviate solo
alla fase di osservazione; la sintesi delle schede, il resoconto e le domande e risposte ricevono testo
derivato.

## Configurazione

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Tutte le chiavi di configurazione di Logbook sono facoltative. I valori numerici vengono arrotondati a interi
e limitati all'intervallo supportato.

| Chiave                    | Valore predefinito | Intervallo o valori       | Comportamento                                                                                |
| ------------------------- | ------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`             | booleano                  | Interruttore principale persistente per le nuove istantanee; la cronologia rimane disponibile con `false` |
| `captureIntervalSeconds`  | `30`               | `5`-`600`                 | Intervallo tra i tentativi di acquisizione                                                    |
| `analysisIntervalMinutes` | `15`               | `3`-`120`                 | Finestra di osservazione prevista; interruzioni e mezzanotte possono chiuderla prima          |
| `nodeId`                  | non impostato      | ID o nome visualizzato del Node | Vincola l'acquisizione a un Node connesso; la corrispondenza non distingue maiuscole e minuscole |
| `screenIndex`             | `0`                | `0`-`16`                  | Indice dello schermo con base zero                                                            |
| `maxWidth`                | `1440`             | `480`-`3840`              | Limite richiesto per le dimensioni dell'acquisizione; macOS headless lo applica alla dimensione maggiore |
| `visionModel`             | non impostato      | `provider/model`          | Percorso strutturato esplicito; i riferimenti non validi sospendono l'analisi, i provider non supportati causano il fallimento dei batch |
| `retentionDays`           | `14`               | `1`-`365`                 | Elimina i fotogrammi meno recenti; schede, osservazioni e resoconti rimangono                 |

Senza `nodeId`, Logbook preferisce un Node dell'app connesso che esponga
`screen.snapshot`, quindi ripiega su un Node headless che esponga
`logbook.snapshot`. In una configurazione non vincolata, un Node che non funziona viene spostato dietro gli altri
Node idonei. L'interruttore di pausa del pannello di controllo si applica solo alla sessione e viene reimpostato quando il
Gateway si riavvia; usa `captureEnabled: false` per un arresto persistente.

### Selezione del modello di visione

Logbook risolve il modello di osservazione nel seguente ordine:

1. `plugins.entries.logbook.config.visionModel`
2. la prima voce Codex con supporto delle immagini in `tools.media.image.models`
3. la prima voce Codex con supporto delle immagini in `tools.media.models`

Gli altri provider multimediali vengono ignorati perché attualmente non espongono il
contratto di estrazione strutturata richiesto da Logbook. L'impostazione
`tools.media.image.enabled: false` disabilita i valori predefiniti multimediali presi in prestito, ma un
`visionModel` esplicito di Logbook continua a essere applicato.

## Scheda del pannello di controllo

- **Cronologia**: schede espandibili per ciascuna attività con colori delle categorie, app
  principale, indicatori delle distrazioni e un fotogramma chiave dell'istantanea.
- **Giornata in sintesi**: rapporto di concentrazione, ripartizione per categorie, app principali.
- **Resoconto giornaliero**: trasforma ieri e oggi in un aggiornamento pronto da incollare.
- **Domande sulla giornata**: domande in linguaggio naturale con risposte basate sulla
  cronologia monitorata ("quando ho esaminato la PR del Gateway?").
- **Analizza ora**: chiude immediatamente la finestra di acquisizione corrente anziché
  attendere l'intervallo di analisi.

## Metodi del Gateway

Logbook registra i seguenti metodi RPC del Gateway:

| Metodo                | Parametri                | Ambito           | Risultato                                                                |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | nessuno                  | `operator.read`  | Stato dell'acquisizione, dell'analisi, del modello, del Node, del giorno del Gateway e del fuso orario del Gateway |
| `logbook.days`        | nessuno                  | `operator.read`  | Giorni con conteggi delle schede della cronologia e relativi limiti temporali |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Schede derivate e statistiche giornaliere; per impostazione predefinita usa il giorno corrente del Gateway |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadati dei fotogrammi nell'intervallo richiesto espresso in millisecondi dall'epoca |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Un fotogramma JPEG grezzo in base64                                      |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Testo del resoconto memorizzato nella cache o rigenerato per un giorno    |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Risposta basata sulla cronologia di un giorno                             |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Stato di pausa applicato solo alla sessione e stato aggiornato            |
| `logbook.analyze.now` | nessuno                  | `operator.write` | Avvia l'analisi in sospeso o restituisce il motivo per cui non è stato possibile avviarla |

I metodi di lettura restituiscono lo stato operativo o il testo derivato. I pixel grezzi delle schermate,
le azioni che comportano consumo del modello e le modifiche del runtime richiedono
`operator.write`. Anche la scheda della UI di controllo richiede `operator.write` perché
espone tali azioni e le anteprime dei fotogrammi grezzi; un client di sola lettura può comunque chiamare
direttamente i metodi del testo derivato.

## Note sulla privacy

- Le istantanee possono contenere qualsiasi elemento visualizzato sullo schermo, inclusi dati segreti. I fotogrammi non
  lasciano mai il computer, salvo quando vengono usati come input campionato per il modello di osservazione
  configurato.
- Le osservazioni, le schede recenti e le domande possono lasciare il computer tramite il
  modello predefinito dell'agente durante la sintesi delle schede, la generazione del resoconto o le domande e risposte. Applica
  i criteri di gestione dei dati del provider a entrambi i percorsi dei modelli.
- Usa percorsi locali sia per il modello di osservazione strutturata sia per il modello predefinito
  dell'agente quando è necessaria una pipeline completamente locale.
- I fotogrammi, il database della cronologia e le acquisizioni temporanee vengono scritti con
  autorizzazioni dei file riservate al proprietario.
- L'aggiunta di `screen.snapshot` a `gateway.nodes.denyCommands` funge da
  interruttore generale per l'acquisizione dello schermo: blocca sia l'acquisizione del Node dell'app sia il comando
  `logbook.snapshot` di Logbook.
- L'impostazione `tools.media.image.enabled: false` impedisce inoltre a Logbook di prendere in prestito
  i modelli multimediali per immagini per l'analisi; in tal caso viene usato soltanto un `visionModel` esplicito nella
  configurazione del Plugin.

## Risoluzione dei problemi

### La scheda Logbook non è presente

Controlla tutti e tre i requisiti:

1. `openclaw plugins list --enabled` include `logbook`.
2. Il Gateway è stato riavviato dopo la modifica del Plugin o dell'elenco consentito.
3. La connessione della UI di controllo dispone di `operator.write`; le sessioni di sola lettura non
   ricevono il descrittore della scheda interattiva.

Se `plugins.allow` è impostato, deve includere sia `logbook` sia `codex` per la
configurazione consigliata.

### L'acquisizione segnala un errore

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Verifica che il nodo esponga `screen.snapshot` o `logbook.snapshot`.
- Concedi l'autorizzazione Registrazione schermo sul Mac di acquisizione.
- Se `nodeId` è configurato, verifica che corrisponda all'ID del nodo o al nome visualizzato.
- Verifica che `gateway.nodes.denyCommands` non contenga
  `screen.snapshot`.

Dopo tre errori consecutivi, Logbook applica un'attesa per dieci cicli di acquisizione e
quindi riprova. Una configurazione non vincolata può passare a un altro nodo idoneo.

### Le acquisizioni riescono, ma non compaiono schede

- Lo stato **Modello mancante** indica che non è stato trovato alcun percorso di visione strutturata
  compatibile. Abilita e autentica il Plugin Codex oppure imposta un
  `visionModel` esplicito valido. I fotogrammi acquisiti restano in sospeso finché manca il modello e
  possono essere analizzati dopo aver corretto la configurazione.
- Attendi per `analysisIntervalMinutes` oppure seleziona **Analizza ora** dopo che
  è stata acquisita dell'attività.
- I fotogrammi consecutivi identici costituiscono una prova di inattività e non entrano nei batch di
  analisi. Modifica la schermata visibile prima di eseguire il test.
- Se il batch più recente mostra un errore, correggi il problema del modello o di autenticazione e seleziona
  **Analizza ora**. I batch non riusciti vengono riprovati solo tramite questa azione esplicita, per
  evitare costi ripetuti del modello.

## Contenuti correlati

- [Gestire i plugin](/it/plugins/manage-plugins)
- [Harness Codex](/it/plugins/codex-harness)
- [Comprensione dei contenuti multimediali](/it/nodes/media-understanding)
- [Nodi](/it/nodes)
- [Risoluzione dei problemi dei nodi](/it/nodes/troubleshooting)
- [Interfaccia di controllo](/it/web/control-ui)
