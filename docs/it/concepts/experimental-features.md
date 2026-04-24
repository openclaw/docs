---
read_when:
    - Vedi una chiave di configurazione `.experimental` e vuoi sapere se è stabile
    - Vuoi provare funzionalità runtime in anteprima senza confonderle con i valori predefiniti normali
    - Vuoi un unico posto in cui trovare i flag sperimentali attualmente documentati
summary: Cosa significano i flag sperimentali in OpenClaw e quali sono attualmente documentati
title: Funzionalità sperimentali
x-i18n:
    generated_at: "2026-04-24T08:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Le funzionalità sperimentali in OpenClaw sono **superfici di anteprima con adesione esplicita**. Sono
dietro flag espliciti perché hanno ancora bisogno di utilizzo nel mondo reale prima di
meritare un valore predefinito stabile o un contratto pubblico duraturo.

Trattale in modo diverso dalla configurazione normale:

- Lasciale **disattivate per impostazione predefinita** a meno che la documentazione correlata non ti dica di provarne una.
- Aspettati che **forma e comportamento cambino** più rapidamente rispetto alla configurazione stabile.
- Preferisci prima il percorso stabile, quando esiste già.
- Se stai distribuendo OpenClaw su larga scala, testa i flag sperimentali in un ambiente più piccolo
  prima di inserirli in una baseline condivisa.

## Flag attualmente documentati

| Superficie               | Chiave                                                    | Usala quando                                                                                                   | Altro                                                                                         |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime del modello locale | `agents.defaults.experimental.localModelLean`             | Un backend locale più piccolo o più rigido ha problemi con l'intera superficie degli strumenti predefinita di OpenClaw | [Modelli locali](/it/gateway/local-models)                                                       |
| Ricerca in memoria       | `agents.defaults.memorySearch.experimental.sessionMemory` | Vuoi che `memory_search` indicizzi le trascrizioni delle sessioni precedenti e accetti il costo aggiuntivo di archiviazione/indicizzazione | [Riferimento della configurazione della memoria](/it/reference/memory-config#session-memory-search-experimental) |
| Strumento di pianificazione strutturata | `tools.experimental.planTool`                             | Vuoi che lo strumento strutturato `update_plan` sia esposto per il tracciamento del lavoro multi-step in runtime e UI compatibili | [Riferimento della configurazione del Gateway](/it/gateway/config-tools#toolsexperimental)       |

## Modalità lean del modello locale

`agents.defaults.experimental.localModelLean: true` è una valvola di sfogo
per configurazioni più deboli dei modelli locali. Riduce gli strumenti predefiniti pesanti come
`browser`, `cron` e `message` così la forma del prompt è più piccola e meno fragile
per backend compatibili OpenAI con contesto ridotto o più rigidi.

Questo intenzionalmente **non** è il percorso normale. Se il tuo backend gestisce bene l'intero
runtime, lascialo disattivato.

## Sperimentale non significa nascosto

Se una funzionalità è sperimentale, OpenClaw dovrebbe dirlo chiaramente nella documentazione e nel
percorso di configurazione stesso. Quello che **non** dovrebbe fare è introdurre di nascosto un comportamento di anteprima in una manopola predefinita dall'aspetto stabile e far finta che sia normale. È così che le superfici di configurazione
diventano disordinate.

## Correlati

- [Funzionalità](/it/concepts/features)
- [Canali di rilascio](/it/install/development-channels)
