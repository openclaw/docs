---
read_when:
    - Vuoi ridurre la crescita del contesto causata dagli output degli strumenti
    - Vuoi capire l'ottimizzazione della prompt cache di Anthropic
summary: Riduzione dei vecchi risultati degli strumenti per mantenere il contesto snello e la cache efficiente
title: Potatura della sessione
x-i18n:
    generated_at: "2026-04-24T08:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

La potatura della sessione riduce i **vecchi risultati degli strumenti** dal contesto prima di ogni
chiamata LLM. Riduce il gonfiore del contesto causato dall'accumulo degli output degli strumenti (risultati exec, letture
file, risultati di ricerca) senza riscrivere il normale testo della conversazione.

<Info>
La potatura avviene solo in memoria -- non modifica la trascrizione della sessione su disco.
La cronologia completa viene sempre preservata.
</Info>

## Perché è importante

Le sessioni lunghe accumulano output degli strumenti che gonfiano la finestra di contesto. Questo
aumenta il costo e può forzare la [Compaction](/it/concepts/compaction) prima del
necessario.

La potatura è particolarmente preziosa per la **prompt cache di Anthropic**. Dopo la scadenza del TTL della cache,
la richiesta successiva rimette in cache l'intero prompt. La potatura riduce la dimensione della scrittura in cache, abbassando direttamente il costo.

## Come funziona

1. Attende la scadenza del TTL della cache (predefinito 5 minuti).
2. Trova i vecchi risultati degli strumenti per la normale potatura (il testo della conversazione resta intatto).
3. **Soft-trim** dei risultati troppo grandi -- mantiene inizio e fine, inserisce `...`.
4. **Hard-clear** del resto -- sostituisce con un segnaposto.
5. Reimposta il TTL così le richieste successive riutilizzano la cache aggiornata.

## Pulizia legacy delle immagini

OpenClaw esegue anche una pulizia idempotente separata per le vecchie sessioni legacy che
salvavano blocchi immagine grezzi nella cronologia.

- Preserva i **3 turni completati più recenti** byte per byte così i prefissi della prompt
  cache per i follow-up recenti restano stabili.
- I blocchi immagine più vecchi già elaborati nella cronologia `user` o `toolResult` possono essere
  sostituiti con `[image data removed - already processed by model]`.
- Questo è separato dalla normale potatura TTL della cache. Esiste per evitare che payload
  immagine ripetuti facciano saltare la prompt cache nei turni successivi.

## Valori predefiniti intelligenti

OpenClaw abilita automaticamente la potatura per i profili Anthropic:

| Tipo di profilo                                        | Potatura abilitata | Heartbeat |
| ------------------------------------------------------ | ------------------ | --------- |
| Auth OAuth/token Anthropic (incluso il riutilizzo di Claude CLI) | Sì                 | 1 ora     |
| Chiave API                                             | Sì                 | 30 min    |

Se imposti valori espliciti, OpenClaw non li sovrascrive.

## Abilitare o disabilitare

La potatura è disattivata per impostazione predefinita per i provider non Anthropic. Per abilitarla:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Per disabilitarla: imposta `mode: "off"`.

## Potatura vs Compaction

|            | Potatura             | Compaction              |
| ---------- | -------------------- | ----------------------- |
| **Cosa**   | Riduce i risultati degli strumenti | Riassume la conversazione |
| **Salvata?** | No (per richiesta) | Sì (nella trascrizione) |
| **Ambito** | Solo risultati degli strumenti | Intera conversazione     |

Si completano a vicenda -- la potatura mantiene snello l'output degli strumenti tra
i cicli di Compaction.

## Approfondimenti

- [Compaction](/it/concepts/compaction) -- riduzione del contesto basata sul riassunto
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione della potatura
  (`contextPruning.*`)

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Strumenti di sessione](/it/concepts/session-tool)
- [Motore di contesto](/it/concepts/context-engine)
