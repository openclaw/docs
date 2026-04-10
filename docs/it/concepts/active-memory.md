---
read_when:
    - Vuoi capire a cosa serve la memoria attiva
    - Vuoi attivare la memoria attiva per un agente conversazionale
    - Vuoi regolare il comportamento della memoria attiva senza abilitarla ovunque
summary: Un sotto-agente di memoria bloccante di proprietà del plugin che inserisce la memoria pertinente nelle sessioni di chat interattive
title: Memoria attiva
x-i18n:
    generated_at: "2026-04-10T08:13:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a51437df4ae4d9d57764601dfcfcdadb269e2895bf49dc82b9f496c1b3cb341
    source_path: concepts/active-memory.md
    workflow: 15
---

# Memoria attiva

La memoria attiva è un sotto-agente di memoria bloccante opzionale di proprietà del plugin che viene eseguito
prima della risposta principale per le sessioni conversazionali idonee.

Esiste perché la maggior parte dei sistemi di memoria è capace ma reattiva. Si affida
all'agente principale per decidere quando cercare nella memoria, oppure all'utente per dire cose
come "ricorda questo" o "cerca nella memoria". A quel punto, il momento in cui la memoria avrebbe
reso la risposta naturale è già passato.

La memoria attiva offre al sistema una possibilità limitata di far emergere memoria pertinente
prima che venga generata la risposta principale.

## Incolla questo nel tuo agente

Incolla questo nel tuo agente se vuoi abilitare la memoria attiva con una
configurazione autonoma e sicura per impostazione predefinita:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          enabled: true,
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Questo attiva il plugin per l'agente `main`, lo mantiene limitato per impostazione predefinita alle
sessioni in stile messaggio diretto, gli consente di ereditare prima il modello della sessione corrente e
consente comunque il fallback remoto integrato se non è disponibile alcun modello esplicito o ereditato.

Dopo, riavvia il gateway:

```bash
node scripts/run-node.mjs gateway --profile dev
```

Per ispezionarlo in tempo reale in una conversazione:

```text
/verbose on
```

## Attiva la memoria attiva

La configurazione più sicura è:

1. abilitare il plugin
2. scegliere come target un agente conversazionale
3. mantenere il logging attivo solo durante la regolazione

Inizia con questo in `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          allowedChatTypes: ["direct"],
          modelFallbackPolicy: "default-remote",
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          persistTranscripts: false,
          logging: true,
        },
      },
    },
  },
}
```

Poi riavvia il gateway:

```bash
node scripts/run-node.mjs gateway --profile dev
```

Cosa significa:

- `plugins.entries.active-memory.enabled: true` attiva il plugin
- `config.agents: ["main"]` abilita la memoria attiva solo per l'agente `main`
- `config.allowedChatTypes: ["direct"]` mantiene la memoria attiva abilitata solo per impostazione predefinita per le sessioni in stile messaggio diretto
- se `config.model` non è impostato, la memoria attiva eredita prima il modello della sessione corrente
- `config.modelFallbackPolicy: "default-remote"` mantiene come impostazione predefinita il fallback remoto integrato quando non è disponibile alcun modello esplicito o ereditato
- `config.promptStyle: "balanced"` usa lo stile di prompt predefinito per uso generale per la modalità `recent`
- la memoria attiva viene comunque eseguita solo su sessioni di chat persistenti interattive idonee

## Come vederla

La memoria attiva inserisce contesto di sistema nascosto per il modello. Non espone
tag raw `<active_memory_plugin>...</active_memory_plugin>` al client.

## Interruttore della sessione

Usa il comando del plugin quando vuoi mettere in pausa o riprendere la memoria attiva per la
sessione di chat corrente senza modificare la configurazione:

```text
/active-memory status
/active-memory off
/active-memory on
```

Questo è limitato alla sessione. Non modifica
`plugins.entries.active-memory.enabled`, il targeting dell'agente o altre
configurazioni globali.

Se vuoi che il comando scriva la configurazione e metta in pausa o riprenda la memoria attiva per
tutte le sessioni, usa la forma globale esplicita:

```text
/active-memory status --global
/active-memory off --global
/active-memory on --global
```

La forma globale scrive `plugins.entries.active-memory.config.enabled`. Lascia
`plugins.entries.active-memory.enabled` attivo in modo che il comando resti disponibile per
riattivare la memoria attiva in seguito.

Se vuoi vedere cosa sta facendo la memoria attiva in una sessione in tempo reale, attiva la modalità
verbose per quella sessione:

```text
/verbose on
```

Con verbose abilitato, OpenClaw può mostrare:

- una riga di stato della memoria attiva come `Active Memory: ok 842ms recent 34 chars`
- un riepilogo di debug leggibile come `Active Memory Debug: Lemon pepper wings with blue cheese.`

Queste righe derivano dallo stesso passaggio della memoria attiva che alimenta il contesto di
sistema nascosto, ma sono formattate per le persone invece di esporre markup raw del prompt.

Per impostazione predefinita, la trascrizione del sotto-agente di memoria bloccante è temporanea e viene eliminata
dopo il completamento dell'esecuzione.

Flusso di esempio:

```text
/verbose on
quali ali dovrei ordinare?
```

Forma prevista della risposta visibile:

```text
...normale risposta dell'assistente...

🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

## Quando viene eseguita

La memoria attiva usa due criteri:

1. **Adesione esplicita nella configurazione**
   Il plugin deve essere abilitato e l'id dell'agente corrente deve comparire in
   `plugins.entries.active-memory.config.agents`.
2. **Idoneità rigorosa in fase di esecuzione**
   Anche quando è abilitata e selezionata, la memoria attiva viene eseguita solo per
   sessioni di chat persistenti interattive idonee.

La regola effettiva è:

```text
plugin abilitato
+
id agente selezionato
+
tipo di chat consentito
+
sessione di chat persistente interattiva idonea
=
la memoria attiva viene eseguita
```

Se uno qualsiasi di questi fallisce, la memoria attiva non viene eseguita.

## Tipi di sessione

`config.allowedChatTypes` controlla quali tipi di conversazioni possono eseguire la Memoria
attiva.

Il valore predefinito è:

```json5
allowedChatTypes: ["direct"]
```

Questo significa che la Memoria attiva viene eseguita per impostazione predefinita nelle sessioni in stile messaggio diretto, ma
non nelle sessioni di gruppo o di canale a meno che tu non le abiliti esplicitamente.

Esempi:

```json5
allowedChatTypes: ["direct"]
```

```json5
allowedChatTypes: ["direct", "group"]
```

```json5
allowedChatTypes: ["direct", "group", "channel"]
```

## Dove viene eseguita

La memoria attiva è una funzionalità di arricchimento conversazionale, non una
funzionalità di inferenza valida per tutta la piattaforma.

| Superficie                                                          | Esegue la memoria attiva?                               |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| Sessioni persistenti di chat in Control UI / web chat               | Sì, se il plugin è abilitato e l'agente è selezionato   |
| Altre sessioni di canale interattive sullo stesso percorso di chat persistente | Sì, se il plugin è abilitato e l'agente è selezionato   |
| Esecuzioni headless one-shot                                        | No                                                      |
| Esecuzioni heartbeat/background                                     | No                                                      |
| Percorsi interni generici `agent-command`                           | No                                                      |
| Esecuzione di sotto-agenti/helper interni                           | No                                                      |

## Perché usarla

Usa la memoria attiva quando:

- la sessione è persistente e rivolta all'utente
- l'agente ha una memoria a lungo termine significativa da cercare
- continuità e personalizzazione contano più del puro determinismo del prompt

Funziona particolarmente bene per:

- preferenze stabili
- abitudini ricorrenti
- contesto utente a lungo termine che dovrebbe emergere in modo naturale

È poco adatta per:

- automazione
- worker interni
- attività API one-shot
- contesti in cui una personalizzazione nascosta sarebbe sorprendente

## Come funziona

La forma di esecuzione è:

```mermaid
flowchart LR
  U["Messaggio utente"] --> Q["Crea query di memoria"]
  Q --> R["Sotto-agente di memoria bloccante della memoria attiva"]
  R -->|NONE or empty| M["Risposta principale"]
  R -->|relevant summary| I["Aggiungi contesto di sistema nascosto active_memory_plugin"]
  I --> M["Risposta principale"]
```

Il sotto-agente di memoria bloccante può usare solo:

- `memory_search`
- `memory_get`

Se la connessione è debole, dovrebbe restituire `NONE`.

## Modalità di query

`config.queryMode` controlla quanta parte della conversazione vede il sotto-agente di memoria bloccante.

## Stili di prompt

`config.promptStyle` controlla quanto il sotto-agente di memoria bloccante sia
propenso o rigoroso quando decide se restituire memoria.

Stili disponibili:

- `balanced`: valore predefinito per uso generale per la modalità `recent`
- `strict`: il meno propenso; ideale quando vuoi pochissima influenza dal contesto vicino
- `contextual`: il più favorevole alla continuità; ideale quando la cronologia della conversazione dovrebbe contare di più
- `recall-heavy`: più disposto a far emergere memoria anche con corrispondenze meno forti ma comunque plausibili
- `precision-heavy`: preferisce in modo aggressivo `NONE` a meno che la corrispondenza non sia ovvia
- `preference-only`: ottimizzato per preferiti, abitudini, routine, gusti e fatti personali ricorrenti

Mappatura predefinita quando `config.promptStyle` non è impostato:

```text
message -> strict
recent -> balanced
full -> contextual
```

Se imposti `config.promptStyle` esplicitamente, quell'override prevale.

Esempio:

```json5
promptStyle: "preference-only"
```

## Criterio di fallback del modello

Se `config.model` non è impostato, la Memoria attiva prova a risolvere un modello in questo ordine:

```text
modello esplicito del plugin
-> modello della sessione corrente
-> modello primario dell'agente
-> fallback remoto integrato opzionale
```

`config.modelFallbackPolicy` controlla l'ultimo passaggio.

Valore predefinito:

```json5
modelFallbackPolicy: "default-remote"
```

Altra opzione:

```json5
modelFallbackPolicy: "resolved-only"
```

Usa `resolved-only` se vuoi che la Memoria attiva salti il recupero invece di usare
il valore predefinito remoto integrato quando non è disponibile alcun modello esplicito o
ereditato.

## Meccanismi di uscita avanzati

Queste opzioni intenzionalmente non fanno parte della configurazione consigliata.

`config.thinking` può sostituire il livello di thinking del sotto-agente di memoria bloccante:

```json5
thinking: "medium"
```

Valore predefinito:

```json5
thinking: "off"
```

Non abilitarlo per impostazione predefinita. La Memoria attiva viene eseguita nel percorso della risposta, quindi tempo di
thinking aggiuntivo aumenta direttamente la latenza visibile all'utente.

`config.promptAppend` aggiunge istruzioni supplementari per l'operatore dopo il prompt predefinito della Memoria
attiva e prima del contesto della conversazione:

```json5
promptAppend: "Dai priorità alle preferenze stabili a lungo termine rispetto agli eventi una tantum."
```

`config.promptOverride` sostituisce il prompt predefinito della Memoria attiva. OpenClaw
continua comunque ad aggiungere dopo il contesto della conversazione:

```json5
promptOverride: "Sei un agente di ricerca della memoria. Restituisci NONE o un fatto utente compatto."
```

La personalizzazione del prompt non è consigliata a meno che tu non stia testando deliberatamente un
contratto di recupero diverso. Il prompt predefinito è regolato per restituire `NONE`
oppure un contesto compatto di fatti utente per il modello principale.

### `message`

Viene inviato solo l'ultimo messaggio dell'utente.

```text
Solo l'ultimo messaggio dell'utente
```

Usalo quando:

- vuoi il comportamento più veloce
- vuoi il bias più forte verso il recupero di preferenze stabili
- i turni successivi non hanno bisogno del contesto conversazionale

Timeout consigliato:

- inizia intorno a `3000` a `5000` ms

### `recent`

Vengono inviati l'ultimo messaggio dell'utente più una piccola coda conversazionale recente.

```text
Coda recente della conversazione:
user: ...
assistant: ...
user: ...

Ultimo messaggio dell'utente:
...
```

Usalo quando:

- vuoi un miglior equilibrio tra velocità e ancoraggio conversazionale
- le domande di follow-up spesso dipendono dagli ultimi pochi turni

Timeout consigliato:

- inizia intorno a `15000` ms

### `full`

L'intera conversazione viene inviata al sotto-agente di memoria bloccante.

```text
Contesto completo della conversazione:
user: ...
assistant: ...
user: ...
...
```

Usalo quando:

- la massima qualità del recupero conta più della latenza
- la conversazione contiene impostazioni importanti molto indietro nel thread

Timeout consigliato:

- aumentalo in modo significativo rispetto a `message` o `recent`
- inizia intorno a `15000` ms o più, a seconda della dimensione del thread

In generale, il timeout dovrebbe aumentare con la dimensione del contesto:

```text
message < recent < full
```

## Persistenza della trascrizione

Le esecuzioni del sotto-agente di memoria bloccante della memoria attiva creano una vera trascrizione `session.jsonl` durante la chiamata del sotto-agente di memoria bloccante.

Per impostazione predefinita, quella trascrizione è temporanea:

- viene scritta in una directory temporanea
- viene usata solo per l'esecuzione del sotto-agente di memoria bloccante
- viene eliminata immediatamente dopo la fine dell'esecuzione

Se vuoi conservare su disco quelle trascrizioni del sotto-agente di memoria bloccante per debug o
ispezione, attiva esplicitamente la persistenza:

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          persistTranscripts: true,
          transcriptDir: "active-memory",
        },
      },
    },
  },
}
```

Quando è abilitata, la memoria attiva archivia le trascrizioni in una directory separata sotto la
cartella delle sessioni dell'agente di destinazione, non nel percorso principale della trascrizione
della conversazione utente.

Il layout predefinito è, concettualmente:

```text
agents/<agent>/sessions/active-memory/<blocking-memory-sub-agent-session-id>.jsonl
```

Puoi modificare la sottodirectory relativa con `config.transcriptDir`.

Usalo con attenzione:

- le trascrizioni del sotto-agente di memoria bloccante possono accumularsi rapidamente nelle sessioni molto attive
- la modalità di query `full` può duplicare molto contesto conversazionale
- queste trascrizioni contengono contesto nascosto del prompt e memorie recuperate

## Configurazione

Tutta la configurazione della memoria attiva si trova in:

```text
plugins.entries.active-memory
```

I campi più importanti sono:

| Chiave                      | Tipo                                                                                                 | Significato                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `enabled`                   | `boolean`                                                                                            | Abilita il plugin stesso                                                                                     |
| `config.agents`             | `string[]`                                                                                           | ID agente che possono usare la memoria attiva                                                                |
| `config.model`              | `string`                                                                                             | Riferimento facoltativo al modello del sotto-agente di memoria bloccante; se non è impostato, la memoria attiva usa il modello della sessione corrente |
| `config.queryMode`          | `"message" \| "recent" \| "full"`                                                                    | Controlla quanta parte della conversazione vede il sotto-agente di memoria bloccante                         |
| `config.promptStyle`        | `"balanced" \| "strict" \| "contextual" \| "recall-heavy" \| "precision-heavy" \| "preference-only"` | Controlla quanto il sotto-agente di memoria bloccante sia propenso o rigoroso nel decidere se restituire memoria |
| `config.thinking`           | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "adaptive"`                         | Override avanzato del thinking per il sotto-agente di memoria bloccante; valore predefinito `off` per velocità |
| `config.promptOverride`     | `string`                                                                                             | Sostituzione avanzata completa del prompt; non consigliata per l'uso normale                                 |
| `config.promptAppend`       | `string`                                                                                             | Istruzioni supplementari avanzate aggiunte al prompt predefinito o sostituito                               |
| `config.timeoutMs`          | `number`                                                                                             | Timeout rigido per il sotto-agente di memoria bloccante                                                      |
| `config.maxSummaryChars`    | `number`                                                                                             | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory                                 |
| `config.logging`            | `boolean`                                                                                            | Emette log della memoria attiva durante la regolazione                                                       |
| `config.persistTranscripts` | `boolean`                                                                                            | Mantiene su disco le trascrizioni del sotto-agente di memoria bloccante invece di eliminare i file temporanei |
| `config.transcriptDir`      | `string`                                                                                             | Directory relativa delle trascrizioni del sotto-agente di memoria bloccante sotto la cartella delle sessioni dell'agente |

Campi utili per la regolazione:

| Chiave                        | Tipo     | Significato                                                       |
| ----------------------------- | -------- | ----------------------------------------------------------------- |
| `config.maxSummaryChars`      | `number` | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory |
| `config.recentUserTurns`      | `number` | Turni utente precedenti da includere quando `queryMode` è `recent`      |
| `config.recentAssistantTurns` | `number` | Turni assistente precedenti da includere quando `queryMode` è `recent` |
| `config.recentUserChars`      | `number` | Numero massimo di caratteri per turno utente recente              |
| `config.recentAssistantChars` | `number` | Numero massimo di caratteri per turno assistente recente          |
| `config.cacheTtlMs`           | `number` | Riutilizzo della cache per query identiche ripetute               |

## Configurazione consigliata

Inizia con `recent`.

```json5
{
  plugins: {
    entries: {
      "active-memory": {
        enabled: true,
        config: {
          agents: ["main"],
          queryMode: "recent",
          promptStyle: "balanced",
          timeoutMs: 15000,
          maxSummaryChars: 220,
          logging: true,
        },
      },
    },
  },
}
```

Se vuoi ispezionare il comportamento in tempo reale durante la regolazione, usa `/verbose on` nella
sessione invece di cercare un comando di debug separato per active-memory.

Poi passa a:

- `message` se vuoi una latenza inferiore
- `full` se decidi che il contesto aggiuntivo vale un sotto-agente di memoria bloccante più lento

## Debug

Se la memoria attiva non compare dove ti aspetti:

1. Conferma che il plugin sia abilitato in `plugins.entries.active-memory.enabled`.
2. Conferma che l'ID dell'agente corrente sia elencato in `config.agents`.
3. Conferma che il test avvenga tramite una sessione di chat persistente interattiva.
4. Attiva `config.logging: true` e osserva i log del gateway.
5. Verifica che la ricerca in memoria funzioni con `openclaw memory status --deep`.

Se i risultati di memoria sono troppo rumorosi, restringi:

- `maxSummaryChars`

Se la memoria attiva è troppo lenta:

- riduci `queryMode`
- riduci `timeoutMs`
- riduci il numero di turni recenti
- riduci i limiti di caratteri per turno

## Pagine correlate

- [Ricerca nella memoria](/it/concepts/memory-search)
- [Riferimento della configurazione della memoria](/it/reference/memory-config)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
