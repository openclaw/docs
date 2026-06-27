---
read_when:
    - Vedi una chiave di configurazione `.experimental` e vuoi sapere se è stabile
    - Vuoi provare le funzionalità runtime in anteprima senza confonderle con i valori predefiniti normali
    - Vuoi un unico posto dove trovare i flag sperimentali attualmente documentati
summary: Cosa significano i flag sperimentali in OpenClaw e quali sono attualmente documentati
title: Funzionalità sperimentali
x-i18n:
    generated_at: "2026-06-27T17:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Le funzionalità sperimentali in OpenClaw sono **superfici di anteprima opt-in**. Sono
dietro flag espliciti perché hanno ancora bisogno di essere provate nel mondo reale prima di
meritare un valore predefinito stabile o un contratto pubblico duraturo.

Trattale in modo diverso dalla configurazione normale:

- Tienile **disattivate per impostazione predefinita**, a meno che la documentazione correlata non ti dica di provarne una.
- Aspettati che **forma e comportamento cambino** più rapidamente rispetto alla configurazione stabile.
- Preferisci prima il percorso stabile quando ne esiste già uno.
- Se stai distribuendo OpenClaw su larga scala, prova i flag sperimentali in un ambiente
  più piccolo prima di integrarli in una baseline condivisa.

## Flag attualmente documentati

| Superficie               | Chiave                                                                                     | Usalo quando                                                                                                                      | Altro                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime del modello locale | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Un backend locale più piccolo o più rigoroso va in difficoltà con la superficie completa degli strumenti predefiniti di OpenClaw | [Modelli locali](/it/gateway/local-models)                                                       |
| Ricerca in memoria       | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Vuoi che `memory_search` indicizzi le trascrizioni delle sessioni precedenti e accetti il costo extra di archiviazione/indicizzazione | [Riferimento configurazione memoria](/it/reference/memory-config#session-memory-search-experimental) |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Vuoi che l'app-server nativo Codex 0.132.0 o più recente usi come target un exec-server basato su sandbox OpenClaw invece di disabilitare la Modalità Codice | [Riferimento harness Codex](/it/plugins/codex-harness-reference#sandboxed-native-execution)      |
| Strumento di pianificazione strutturata | `tools.experimental.planTool`                                                              | Vuoi esporre lo strumento strutturato `update_plan` per tracciare lavori in più passaggi in runtime e UI compatibili             | [Riferimento configurazione Gateway](/it/gateway/config-tools#toolsexperimental)                  |

## Modalità snella per modello locale

`agents.defaults.experimental.localModelLean: true` è una valvola di sfogo per configurazioni di modelli locali più deboli. Quando è attiva, OpenClaw rimuove tre strumenti predefiniti — `browser`, `cron` e `message` — dalla superficie degli strumenti dell'agente per ogni turno. Inoltre, per quell'esecuzione usa per impostazione predefinita controlli strutturati di Ricerca strumenti quando `tools.toolSearch` non è configurato esplicitamente, così cataloghi di strumenti più grandi di Plugin, MCP o client restano dietro `tool_search`, `tool_describe` e `tool_call` invece di essere scaricati nel prompt. Le esecuzioni che richiedono la consegna diretta di `message` mantengono quello strumento diretto invece di abilitare il valore predefinito di Ricerca strumenti della modalità snella. Usa `agents.list[].experimental.localModelLean` per abilitare o disabilitare lo stesso comportamento per un singolo agente configurato.

### Perché questi tre strumenti

Questi tre strumenti hanno le descrizioni più grandi e il maggior numero di forme di parametri nel runtime OpenClaw predefinito. Su un backend con contesto ridotto o compatibile con OpenAI ma più rigoroso, questa è la differenza tra:

- Schemi degli strumenti che entrano pulitamente nel prompt invece di comprimere la cronologia della conversazione.
- Il modello che sceglie lo strumento giusto invece di emettere chiamate agli strumenti malformate perché ci sono troppi schemi dall'aspetto simile.
- L'adapter Chat Completions che resta entro i limiti di output strutturato del server invece di incorrere in un 400 per la dimensione del payload delle chiamate agli strumenti.

Rimuoverli non riconnette silenziosamente OpenClaw in modo diverso: rende solo più breve l'elenco degli strumenti diretti. Il modello ha ancora a disposizione `read`, `write`, `edit`, `exec`, `apply_patch`, ricerca/recupero web (quando configurati), memoria e strumenti di sessione/agente. I cataloghi extra restano richiamabili tramite Ricerca strumenti, a meno che tu non imposti esplicitamente `tools.toolSearch: false`.

### Quando attivarla

Abilita la modalità snella quando hai già dimostrato che il modello può comunicare con il Gateway ma i turni completi dell'agente si comportano male. La catena di segnali tipica è:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` riesce.
2. Un turno normale dell'agente fallisce con chiamate agli strumenti malformate, prompt troppo grandi o il modello che ignora i suoi strumenti.
3. Attivare `localModelLean: true` risolve l'errore.

### Quando lasciarla disattivata

Se il tuo backend gestisce pulitamente il runtime predefinito completo, lasciala disattivata. La modalità snella è un workaround, non un valore predefinito. Esiste perché alcuni stack locali hanno bisogno di una superficie degli strumenti più piccola per comportarsi correttamente; i modelli ospitati e le configurazioni locali ben dimensionate no.

La modalità snella inoltre non sostituisce `tools.profile`, `tools.allow`/`tools.deny` o la via di fuga `compat.supportsTools: false` del modello. Se hai bisogno di una superficie degli strumenti permanentemente più stretta per un agente specifico, preferisci queste manopole stabili al flag sperimentale.

Se configuri già Ricerca strumenti a livello globale, OpenClaw lascia invariata quella configurazione dell'operatore. Imposta `tools.toolSearch: false` per disattivare il valore predefinito di Ricerca strumenti della modalità snella.

### Abilitazione

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Solo per un agente:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Riavvia il Gateway dopo aver modificato il flag, poi conferma l'elenco ridotto degli strumenti con:

```bash
openclaw status --deep
```

L'output di stato approfondito elenca gli strumenti attivi dell'agente; `browser`, `cron` e `message` dovrebbero essere assenti quando la modalità snella è attiva, a meno che la modalità di consegna corrente non forzi risposte dirette tramite `message`.

## Sperimentale non significa nascosto

Se una funzionalità è sperimentale, OpenClaw dovrebbe dirlo chiaramente nella documentazione e nello
stesso percorso di configurazione. Ciò che **non** dovrebbe fare è infilare di nascosto un comportamento
di anteprima in una manopola predefinita dall'aspetto stabile e fingere che sia normale. È così che le
superfici di configurazione diventano disordinate.

## Correlati

- [Funzionalità](/it/concepts/features)
- [Canali di rilascio](/it/install/development-channels)
