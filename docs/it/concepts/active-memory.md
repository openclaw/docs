---
read_when:
    - Vuoi capire a cosa serve la memoria attiva
    - Vuoi attivare la memoria attiva per un agente conversazionale
    - Vuoi regolare il comportamento della memoria attiva senza abilitarla ovunque
summary: Un sotto-agente di memoria di blocco di proprietà del plugin che inserisce memoria pertinente nelle sessioni di chat interattive
title: Memoria attiva
x-i18n:
    generated_at: "2026-04-12T08:07:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59456805c28daaab394ba2a7f87e1104a1334a5cf32dbb961d5d232d9c471d84
    source_path: concepts/active-memory.md
    workflow: 15
---

# Memoria attiva

La memoria attiva è un sotto-agente di memoria di blocco opzionale di proprietà del plugin che viene eseguito prima della risposta principale per le sessioni conversazionali idonee.

Esiste perché la maggior parte dei sistemi di memoria è capace ma reattiva. Si affida all'agente principale per decidere quando cercare nella memoria, oppure all'utente per dire cose come "ricorda questo" o "cerca nella memoria". A quel punto, il momento in cui la memoria avrebbe reso la risposta naturale è già passato.

La memoria attiva offre al sistema un'occasione limitata per far emergere memoria pertinente prima che venga generata la risposta principale.

## Incolla questo nel tuo agente

Incolla questo nel tuo agente se vuoi abilitare la Memoria attiva con una configurazione autonoma e sicura come impostazione predefinita:

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
          modelFallback: "google/gemini-3-flash",
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

Questo attiva il plugin per l'agente `main`, lo mantiene limitato per impostazione predefinita alle sessioni in stile messaggio diretto, gli consente di ereditare prima il modello della sessione corrente e usa il modello di fallback configurato solo se non è disponibile alcun modello esplicito o ereditato.

Dopodiché, riavvia il gateway:

```bash
openclaw gateway
```

Per ispezionarlo in tempo reale in una conversazione:

```text
/verbose on
```

## Attiva la memoria attiva

La configurazione più sicura è:

1. abilitare il plugin
2. scegliere come destinazione un agente conversazionale
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
          modelFallback: "google/gemini-3-flash",
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
openclaw gateway
```

Cosa significa:

- `plugins.entries.active-memory.enabled: true` attiva il plugin
- `config.agents: ["main"]` abilita la memoria attiva solo per l'agente `main`
- `config.allowedChatTypes: ["direct"]` mantiene la memoria attiva attiva per impostazione predefinita solo per le sessioni in stile messaggio diretto
- se `config.model` non è impostato, la memoria attiva eredita prima il modello della sessione corrente
- `config.modelFallback` fornisce facoltativamente il tuo provider/modello di fallback per il richiamo
- `config.promptStyle: "balanced"` usa lo stile di prompt predefinito per uso generale per la modalità `recent`
- la memoria attiva viene comunque eseguita solo su sessioni di chat interattive persistenti idonee

## Come vederla

La memoria attiva inserisce un contesto di sistema nascosto per il modello. Non espone tag grezzi `<active_memory_plugin>...</active_memory_plugin>` al client.

## Interruttore di sessione

Usa il comando del plugin quando vuoi mettere in pausa o riprendere la memoria attiva per la sessione di chat corrente senza modificare la configurazione:

```text
/active-memory status
/active-memory off
/active-memory on
```

Questo è limitato alla sessione. Non modifica `plugins.entries.active-memory.enabled`, la selezione dell'agente o altre configurazioni globali.

Se vuoi che il comando scriva la configurazione e metta in pausa o riprenda la memoria attiva per tutte le sessioni, usa il formato globale esplicito:

```text
/active-memory status --global
/active-memory off --global
/active-memory on --global
```

Il formato globale scrive `plugins.entries.active-memory.config.enabled`. Lascia `plugins.entries.active-memory.enabled` attivo in modo che il comando resti disponibile per riattivare la memoria attiva in seguito.

Se vuoi vedere cosa sta facendo la memoria attiva in una sessione in tempo reale, attiva la modalità dettagliata per quella sessione:

```text
/verbose on
```

Con la modalità dettagliata abilitata, OpenClaw può mostrare:

- una riga di stato della memoria attiva come `Active Memory: ok 842ms recent 34 chars`
- un riepilogo di debug leggibile come `Active Memory Debug: Lemon pepper wings with blue cheese.`

Queste righe derivano dallo stesso passaggio di memoria attiva che alimenta il contesto di sistema nascosto, ma sono formattate per gli esseri umani invece di esporre markup grezzo del prompt.

Per impostazione predefinita, la trascrizione del sotto-agente di memoria di blocco è temporanea e viene eliminata dopo il completamento dell'esecuzione.

Esempio di flusso:

```text
/verbose on
what wings should i order?
```

Forma di risposta visibile prevista:

```text
...normal assistant reply...

🧩 Active Memory: ok 842ms recent 34 chars
🔎 Active Memory Debug: Lemon pepper wings with blue cheese.
```

## Quando viene eseguita

La memoria attiva usa due controlli:

1. **Attivazione tramite configurazione**
   Il plugin deve essere abilitato e l'ID dell'agente corrente deve comparire in
   `plugins.entries.active-memory.config.agents`.
2. **Idoneità rigorosa in fase di esecuzione**
   Anche quando è abilitata e selezionata, la memoria attiva viene eseguita solo per sessioni di chat interattive persistenti idonee.

La regola effettiva è:

```text
plugin abilitato
+
id agente selezionato
+
tipo di chat consentito
+
sessione di chat interattiva persistente idonea
=
la memoria attiva viene eseguita
```

Se uno qualsiasi di questi controlli fallisce, la memoria attiva non viene eseguita.

## Tipi di sessione

`config.allowedChatTypes` controlla quali tipi di conversazioni possono eseguire la Memoria attiva.

L'impostazione predefinita è:

```json5
allowedChatTypes: ["direct"]
```

Questo significa che la Memoria attiva viene eseguita per impostazione predefinita nelle sessioni in stile messaggio diretto, ma non nelle sessioni di gruppo o di canale a meno che non le abiliti esplicitamente.

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

La memoria attiva è una funzionalità di arricchimento conversazionale, non una funzionalità di inferenza valida per l'intera piattaforma.

| Surface                                                             | La memoria attiva viene eseguita?                      |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Sessioni persistenti di Control UI / chat web                       | Sì, se il plugin è abilitato e l'agente è selezionato  |
| Altre sessioni di canale interattive sullo stesso percorso di chat persistente | Sì, se il plugin è abilitato e l'agente è selezionato  |
| Esecuzioni headless one-shot                                        | No                                                     |
| Esecuzioni heartbeat/in background                                  | No                                                     |
| Percorsi interni generici `agent-command`                           | No                                                     |
| Esecuzione di sotto-agenti/helper interni                           | No                                                     |

## Perché usarla

Usa la memoria attiva quando:

- la sessione è persistente e rivolta all'utente
- l'agente ha una memoria a lungo termine significativa da cercare
- continuità e personalizzazione contano più del puro determinismo del prompt

Funziona particolarmente bene per:

- preferenze stabili
- abitudini ricorrenti
- contesto utente a lungo termine che dovrebbe emergere naturalmente

È poco adatta per:

- automazione
- worker interni
- attività API one-shot
- situazioni in cui una personalizzazione nascosta sarebbe sorprendente

## Come funziona

La struttura di runtime è:

```mermaid
flowchart LR
  U["Messaggio utente"] --> Q["Costruisci query di memoria"]
  Q --> R["Sotto-agente di memoria di blocco della Memoria attiva"]
  R -->|NONE o vuoto| M["Risposta principale"]
  R -->|riepilogo pertinente| I["Aggiungi contesto di sistema nascosto active_memory_plugin"]
  I --> M["Risposta principale"]
```

Il sotto-agente di memoria di blocco può usare solo:

- `memory_search`
- `memory_get`

Se la connessione è debole, deve restituire `NONE`.

## Modalità di query

`config.queryMode` controlla quanta parte della conversazione vede il sotto-agente di memoria di blocco.

## Stili di prompt

`config.promptStyle` controlla quanto il sotto-agente di memoria di blocco sia propenso o rigoroso nel decidere se restituire memoria.

Stili disponibili:

- `balanced`: impostazione predefinita per uso generale per la modalità `recent`
- `strict`: il meno propenso; ideale quando vuoi pochissima contaminazione dal contesto vicino
- `contextual`: il più favorevole alla continuità; ideale quando la cronologia della conversazione deve contare di più
- `recall-heavy`: più disposto a far emergere memoria su corrispondenze meno forti ma comunque plausibili
- `precision-heavy`: preferisce in modo aggressivo `NONE` a meno che la corrispondenza non sia evidente
- `preference-only`: ottimizzato per preferiti, abitudini, routine, gusti e fatti personali ricorrenti

Mappatura predefinita quando `config.promptStyle` non è impostato:

```text
message -> strict
recent -> balanced
full -> contextual
```

Se imposti `config.promptStyle` esplicitamente, quell'override ha la precedenza.

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
-> modello di fallback configurato facoltativo
```

`config.modelFallback` controlla il passaggio di fallback configurato.

Fallback personalizzato facoltativo:

```json5
modelFallback: "google/gemini-3-flash"
```

Se non viene risolto alcun modello esplicito, ereditato o di fallback configurato, la Memoria attiva salta il richiamo per quel turno.

`config.modelFallbackPolicy` viene mantenuto solo come campo di compatibilità deprecato per configurazioni più vecchie. Non modifica più il comportamento in fase di esecuzione.

## Escape hatch avanzati

Queste opzioni intenzionalmente non fanno parte della configurazione consigliata.

`config.thinking` può sovrascrivere il livello di ragionamento del sotto-agente di memoria di blocco:

```json5
thinking: "medium"
```

Predefinito:

```json5
thinking: "off"
```

Non abilitarlo per impostazione predefinita. La Memoria attiva viene eseguita nel percorso della risposta, quindi un tempo di ragionamento aggiuntivo aumenta direttamente la latenza visibile all'utente.

`config.promptAppend` aggiunge istruzioni extra dell'operatore dopo il prompt predefinito della Memoria attiva e prima del contesto della conversazione:

```json5
promptAppend: "Prefer stable long-term preferences over one-off events."
```

`config.promptOverride` sostituisce il prompt predefinito della Memoria attiva. OpenClaw aggiunge comunque il contesto della conversazione subito dopo:

```json5
promptOverride: "You are a memory search agent. Return NONE or one compact user fact."
```

La personalizzazione del prompt non è consigliata a meno che tu non stia deliberatamente testando un diverso contratto di richiamo. Il prompt predefinito è regolato per restituire `NONE` oppure un contesto compatto di fatti dell'utente per il modello principale.

### `message`

Viene inviato solo l'ultimo messaggio dell'utente.

```text
Solo l'ultimo messaggio dell'utente
```

Usa questa modalità quando:

- vuoi il comportamento più rapido
- vuoi il bias più forte verso il richiamo di preferenze stabili
- i turni di follow-up non hanno bisogno del contesto conversazionale

Timeout consigliato:

- inizia intorno a `3000` - `5000` ms

### `recent`

Vengono inviati l'ultimo messaggio dell'utente più una piccola coda recente della conversazione.

```text
Coda recente della conversazione:
user: ...
assistant: ...
user: ...

Ultimo messaggio dell'utente:
...
```

Usa questa modalità quando:

- vuoi un migliore equilibrio tra velocità e radicamento conversazionale
- le domande di follow-up dipendono spesso dagli ultimi pochi turni

Timeout consigliato:

- inizia intorno a `15000` ms

### `full`

L'intera conversazione viene inviata al sotto-agente di memoria di blocco.

```text
Contesto completo della conversazione:
user: ...
assistant: ...
user: ...
...
```

Usa questa modalità quando:

- la migliore qualità possibile del richiamo conta più della latenza
- la conversazione contiene un'impostazione importante molto indietro nel thread

Timeout consigliato:

- aumentalo sostanzialmente rispetto a `message` o `recent`
- inizia intorno a `15000` ms o più, a seconda della dimensione del thread

In generale, il timeout dovrebbe aumentare con la dimensione del contesto:

```text
message < recent < full
```

## Persistenza della trascrizione

Le esecuzioni del sotto-agente di memoria di blocco della memoria attiva creano una vera trascrizione `session.jsonl` durante la chiamata del sotto-agente di memoria di blocco.

Per impostazione predefinita, questa trascrizione è temporanea:

- viene scritta in una directory temporanea
- viene usata solo per l'esecuzione del sotto-agente di memoria di blocco
- viene eliminata immediatamente dopo la fine dell'esecuzione

Se vuoi mantenere su disco quelle trascrizioni del sotto-agente di memoria di blocco per il debug o l'ispezione, attiva esplicitamente la persistenza:

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

Quando è abilitata, la memoria attiva archivia le trascrizioni in una directory separata sotto la cartella delle sessioni dell'agente di destinazione, non nel percorso principale della trascrizione della conversazione utente.

La struttura predefinita è, a livello concettuale:

```text
agents/<agent>/sessions/active-memory/<blocking-memory-sub-agent-session-id>.jsonl
```

Puoi modificare la sottodirectory relativa con `config.transcriptDir`.

Usa questa opzione con attenzione:

- le trascrizioni del sotto-agente di memoria di blocco possono accumularsi rapidamente nelle sessioni attive
- la modalità di query `full` può duplicare molto contesto della conversazione
- queste trascrizioni contengono contesto nascosto del prompt e memorie richiamate

## Configurazione

Tutta la configurazione della memoria attiva si trova in:

```text
plugins.entries.active-memory
```

I campi più importanti sono:

| Key                         | Type                                                                                                 | Significato                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `boolean`                                                                                            | Abilita il plugin stesso                                                                                 |
| `config.agents`             | `string[]`                                                                                           | ID degli agenti che possono usare la memoria attiva                                                      |
| `config.model`              | `string`                                                                                             | Riferimento opzionale del modello del sotto-agente di memoria di blocco; se non impostato, la memoria attiva usa il modello della sessione corrente |
| `config.queryMode`          | `"message" \| "recent" \| "full"`                                                                    | Controlla quanta parte della conversazione vede il sotto-agente di memoria di blocco                     |
| `config.promptStyle`        | `"balanced" \| "strict" \| "contextual" \| "recall-heavy" \| "precision-heavy" \| "preference-only"` | Controlla quanto il sotto-agente di memoria di blocco sia propenso o rigoroso nel decidere se restituire memoria |
| `config.thinking`           | `"off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "adaptive"`                         | Override avanzato del livello di ragionamento per il sotto-agente di memoria di blocco; predefinito `off` per velocità |
| `config.promptOverride`     | `string`                                                                                             | Sostituzione avanzata dell'intero prompt; non consigliata per l'uso normale                              |
| `config.promptAppend`       | `string`                                                                                             | Istruzioni extra avanzate aggiunte al prompt predefinito o sostituito                                    |
| `config.timeoutMs`          | `number`                                                                                             | Timeout rigido per il sotto-agente di memoria di blocco                                                  |
| `config.maxSummaryChars`    | `number`                                                                                             | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory                             |
| `config.logging`            | `boolean`                                                                                            | Emette log della memoria attiva durante la regolazione                                                   |
| `config.persistTranscripts` | `boolean`                                                                                            | Mantiene su disco le trascrizioni del sotto-agente di memoria di blocco invece di eliminare i file temporanei |
| `config.transcriptDir`      | `string`                                                                                             | Directory relativa delle trascrizioni del sotto-agente di memoria di blocco sotto la cartella delle sessioni dell'agente |

Campi utili per la regolazione:

| Key                           | Type     | Significato                                                   |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| `config.maxSummaryChars`      | `number` | Numero massimo totale di caratteri consentiti nel riepilogo di active-memory |
| `config.recentUserTurns`      | `number` | Turni utente precedenti da includere quando `queryMode` è `recent` |
| `config.recentAssistantTurns` | `number` | Turni assistant precedenti da includere quando `queryMode` è `recent` |
| `config.recentUserChars`      | `number` | Numero massimo di caratteri per ogni turno utente recente     |
| `config.recentAssistantChars` | `number` | Numero massimo di caratteri per ogni turno assistant recente  |
| `config.cacheTtlMs`           | `number` | Riutilizzo della cache per query identiche ripetute           |

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

Se vuoi ispezionare il comportamento in tempo reale durante la regolazione, usa `/verbose on` nella sessione invece di cercare un comando di debug separato per active-memory.

Poi passa a:

- `message` se vuoi una latenza più bassa
- `full` se decidi che il contesto aggiuntivo vale un sotto-agente di memoria di blocco più lento

## Debugging

Se la memoria attiva non compare dove te l'aspetti:

1. Conferma che il plugin sia abilitato in `plugins.entries.active-memory.enabled`.
2. Conferma che l'ID dell'agente corrente sia elencato in `config.agents`.
3. Conferma di stare testando tramite una sessione di chat interattiva persistente.
4. Attiva `config.logging: true` e osserva i log del gateway.
5. Verifica che la ricerca nella memoria funzioni con `openclaw memory status --deep`.

Se i risultati della memoria sono rumorosi, restringi:

- `maxSummaryChars`

Se la memoria attiva è troppo lenta:

- riduci `queryMode`
- riduci `timeoutMs`
- riduci il numero di turni recenti
- riduci i limiti di caratteri per turno

## Pagine correlate

- [Ricerca nella memoria](/it/concepts/memory-search)
- [Riferimento della configurazione della memoria](/it/reference/memory-config)
- [Configurazione di Plugin SDK](/it/plugins/sdk-setup)
