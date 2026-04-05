---
read_when:
    - Vuoi ridurre la crescita del contesto causata dagli output degli strumenti
    - Vuoi comprendere l'ottimizzazione della cache dei prompt di Anthropic
summary: Riduzione dei vecchi risultati degli strumenti per mantenere il contesto snello e il caching efficiente
title: Pruning della sessione
x-i18n:
    generated_at: "2026-04-05T13:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Pruning della sessione

Il pruning della sessione riduce i **vecchi risultati degli strumenti** dal contesto prima di ogni chiamata LLM. Riduce il gonfiore del contesto dovuto agli output accumulati degli strumenti (risultati di exec, letture di file, risultati di ricerca) senza riscrivere il normale testo della conversazione.

<Info>
Il pruning avviene solo in memoria -- non modifica la trascrizione della sessione su disco.
La cronologia completa viene sempre conservata.
</Info>

## Perché è importante

Le sessioni lunghe accumulano output degli strumenti che gonfiano la finestra di contesto. Questo
aumenta il costo e può forzare la [compattazione](/concepts/compaction) prima del
necessario.

Il pruning è particolarmente utile per il **prompt caching di Anthropic**. Dopo la scadenza del TTL
della cache, la richiesta successiva mette nuovamente in cache l'intero prompt. Il pruning riduce la dimensione di scrittura nella
cache, abbassando direttamente il costo.

## Come funziona

1. Attende la scadenza del TTL della cache (predefinito 5 minuti).
2. Trova i vecchi risultati degli strumenti per il pruning normale (il testo della conversazione viene lasciato invariato).
3. **Riduzione soft** dei risultati troppo grandi -- mantiene l'inizio e la fine, inserendo `...`.
4. **Cancellazione hard** del resto -- sostituisce con un segnaposto.
5. Reimposta il TTL così che le richieste successive riutilizzino la cache aggiornata.

## Pulizia legacy delle immagini

OpenClaw esegue anche una pulizia idempotente separata per le sessioni legacy più vecchie che
mantenevano blocchi immagine grezzi nella cronologia.

- Conserva i **3 turni completati più recenti** byte per byte, così i prefissi della cache dei prompt
  per i follow-up recenti restano stabili.
- I blocchi immagine già elaborati più vecchi nella cronologia `user` o `toolResult` possono essere
  sostituiti con `[image data removed - already processed by model]`.
- Questo è separato dal normale pruning del TTL della cache. Esiste per impedire che payload di immagini ripetuti invalidino le cache dei prompt nei turni successivi.

## Impostazioni predefinite intelligenti

OpenClaw abilita automaticamente il pruning per i profili Anthropic:

| Tipo di profilo                                        | Pruning abilitato | Heartbeat |
| ------------------------------------------------------ | ----------------- | --------- |
| Autenticazione Anthropic OAuth/token (incluso il riuso di Claude CLI) | Sì | 1 ora    |
| Chiave API                                             | Sì                | 30 min    |

Se imposti valori espliciti, OpenClaw non li sovrascrive.

## Abilitare o disabilitare

Il pruning è disattivato per impostazione predefinita per i provider non Anthropic. Per abilitarlo:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Per disabilitarlo: imposta `mode: "off"`.

## Pruning vs compattazione

|            | Pruning                    | Compattazione              |
| ---------- | -------------------------- | -------------------------- |
| **Cosa**   | Riduce i risultati degli strumenti | Riassume la conversazione |
| **Salvato?** | No (per richiesta)       | Sì (nella trascrizione)    |
| **Ambito** | Solo risultati degli strumenti | Intera conversazione   |

Si completano a vicenda -- il pruning mantiene snello l'output degli strumenti tra un
ciclo di compattazione e l'altro.

## Ulteriori letture

- [Compattazione](/concepts/compaction) -- riduzione del contesto basata sul riepilogo
- [Configurazione del Gateway](/gateway/configuration) -- tutti i parametri di configurazione del pruning
  (`contextPruning.*`)
