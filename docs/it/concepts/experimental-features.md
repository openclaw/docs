---
read_when:
    - Vedi una chiave di configurazione `.experimental` e vuoi sapere se è stabile
    - Vuoi provare le funzionalità di runtime in anteprima senza confonderle con le impostazioni predefinite normali
    - Vuoi un unico posto in cui trovare i flag sperimentali attualmente documentati
summary: Cosa significano i flag sperimentali in OpenClaw e quali sono attualmente documentati
title: Funzionalità sperimentali
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Le funzionalità sperimentali in OpenClaw sono **superfici di anteprima opt-in**. Sono
dietro flag espliciti perché hanno ancora bisogno di esperienza sul campo prima di
meritare un default stabile o un contratto pubblico duraturo.

Trattale diversamente dalla configurazione normale:

- Tienile **disattivate per default** a meno che la documentazione correlata non ti dica di provarne una.
- Aspettati che **struttura e comportamento cambino** più rapidamente rispetto alla configurazione stabile.
- Preferisci prima il percorso stabile quando ne esiste già uno.
- Se stai distribuendo OpenClaw su larga scala, testa i flag sperimentali in un ambiente più piccolo
  prima di integrarli in una baseline condivisa.

## Flag attualmente documentati

| Superficie               | Chiave                                                    | Usala quando                                                                                                    | Altro                                                                                         |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime modello locale   | `agents.defaults.experimental.localModelLean`             | Un backend locale più piccolo o più rigoroso fatica con l'intera superficie degli strumenti di default di OpenClaw | [Modelli locali](/it/gateway/local-models)                                                       |
| Ricerca memoria          | `agents.defaults.memorySearch.experimental.sessionMemory` | Vuoi che `memory_search` indicizzi le trascrizioni delle sessioni precedenti e accetti il costo extra di archiviazione/indicizzazione | [Riferimento configurazione memoria](/it/reference/memory-config#session-memory-search-experimental) |
| Strumento di pianificazione strutturata | `tools.experimental.planTool`                             | Vuoi esporre lo strumento strutturato `update_plan` per il tracciamento del lavoro multi-step in runtime e UI compatibili | [Riferimento configurazione Gateway](/it/gateway/config-tools#toolsexperimental)                 |

## Modalità lean per modello locale

`agents.defaults.experimental.localModelLean: true` è una valvola di sfogo per configurazioni con modelli locali più deboli. Quando è attiva, OpenClaw rimuove tre strumenti di default — `browser`, `cron` e `message` — dalla superficie degli strumenti dell'agente per ogni turno. Nient'altro cambia.

### Perché questi tre strumenti

Questi tre strumenti hanno le descrizioni più lunghe e il maggior numero di forme dei parametri nel runtime OpenClaw di default. Su un backend compatibile con OpenAI con contesto ridotto o più rigoroso, questa è la differenza tra:

- Schemi degli strumenti che entrano in modo pulito nel prompt rispetto a schemi che comprimono la cronologia della conversazione.
- Il modello che sceglie lo strumento giusto rispetto all'emissione di chiamate agli strumenti malformate perché ci sono troppi schemi dall'aspetto simile.
- L'adapter Chat Completions che resta dentro i limiti di output strutturato del server rispetto all'attivazione di un 400 sulla dimensione del payload delle chiamate agli strumenti.

Rimuoverli non ricabla silenziosamente OpenClaw: accorcia semplicemente l'elenco degli strumenti. Il modello ha ancora a disposizione `read`, `write`, `edit`, `exec`, `apply_patch`, ricerca/recupero web (quando configurati), memoria e strumenti di sessione/agente.

### Quando attivarla

Abilita la modalità lean quando hai già dimostrato che il modello può parlare con il Gateway ma i turni completi dell'agente si comportano male. La catena di segnali tipica è:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` riesce.
2. Un turno normale dell'agente fallisce con chiamate agli strumenti malformate, prompt sovradimensionati o il modello che ignora i propri strumenti.
3. L'attivazione di `localModelLean: true` risolve il problema.

### Quando lasciarla disattivata

Se il tuo backend gestisce correttamente l'intero runtime di default, lascia questa opzione disattivata. La modalità lean è una soluzione alternativa, non un default. Esiste perché alcuni stack locali hanno bisogno di una superficie degli strumenti più piccola per comportarsi correttamente; i modelli ospitati e le configurazioni locali ben dimensionate no.

La modalità lean inoltre non sostituisce `tools.profile`, `tools.allow`/`tools.deny` o la via di uscita `compat.supportsTools: false` del modello. Se ti serve una superficie degli strumenti permanentemente più ristretta per un agente specifico, preferisci quei controlli stabili al flag sperimentale.

### Abilitare

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

Riavvia il Gateway dopo aver modificato il flag, quindi conferma l'elenco degli strumenti ridotto con:

```bash
openclaw status --deep
```

L'output di stato approfondito elenca gli strumenti attivi dell'agente; `browser`, `cron` e `message` dovrebbero essere assenti quando la modalità lean è attiva.

## Sperimentale non significa nascosto

Se una funzionalità è sperimentale, OpenClaw dovrebbe dirlo chiaramente nella documentazione e nel
percorso di configurazione stesso. Quello che **non** dovrebbe fare è infilare di nascosto un comportamento di anteprima in un
controllo dall'aspetto stabile e fingere che sia normale. È così che le superfici di
configurazione diventano confuse.

## Correlati

- [Funzionalità](/it/concepts/features)
- [Canali di rilascio](/it/install/development-channels)
