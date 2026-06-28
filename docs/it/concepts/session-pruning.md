---
read_when:
    - Vuoi ridurre la crescita del contesto dovuta agli output degli strumenti
    - Vuoi capire l'ottimizzazione della cache dei prompt Anthropic
summary: Riduzione dei vecchi risultati degli strumenti per mantenere il contesto snello e la cache efficiente
title: Potatura della sessione
x-i18n:
    generated_at: "2026-04-26T11:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
    postprocess_version: locale-links-v1
---

La potatura della sessione riduce i **vecchi risultati degli strumenti** dal contesto prima di ogni chiamata LLM. Riduce il rigonfiamento del contesto dovuto agli output accumulati degli strumenti (risultati exec, letture di file, risultati di ricerca) senza riscrivere il normale testo della conversazione.

<Info>
La potatura è solo in memoria -- non modifica il transcript della sessione su disco.
La cronologia completa viene sempre preservata.
</Info>

## Perché è importante

Le sessioni lunghe accumulano output degli strumenti che gonfiano la finestra di contesto. Questo
aumenta il costo e può forzare la [Compaction](/it/concepts/compaction) prima del
necessario.

La potatura è particolarmente preziosa per la **cache dei prompt Anthropic**. Dopo la scadenza
del TTL della cache, la richiesta successiva rimette in cache l'intero prompt. La potatura riduce la
dimensione della scrittura in cache, abbassando direttamente il costo.

## Come funziona

1. Attendi la scadenza del TTL della cache (predefinito 5 minuti).
2. Trova i vecchi risultati degli strumenti per la normale potatura (il testo della conversazione resta invariato).
3. **Soft-trim** dei risultati sovradimensionati -- mantieni testa e coda, inserisci `...`.
4. **Hard-clear** del resto -- sostituiscilo con un segnaposto.
5. Reimposta il TTL così che le richieste successive riutilizzino la cache aggiornata.

## Pulizia legacy delle immagini

OpenClaw costruisce anche una vista di replay separata e idempotente per le sessioni che
mantengono blocchi immagine grezzi o marcatori media di idratazione del prompt nella cronologia.

- Preserva i **3 turni completati più recenti** byte per byte così che i
  prefissi della cache dei prompt per i follow-up recenti restino stabili.
- Nella vista di replay, i vecchi blocchi immagine già elaborati dalla cronologia `user` o
  `toolResult` possono essere sostituiti con
  `[image data removed - already processed by model]`.
- I vecchi riferimenti media testuali come `[media attached: ...]`,
  `[Image: source: ...]` e `media://inbound/...` possono essere sostituiti con
  `[media reference removed - already processed by model]`. I marcatori di allegato del turno
  corrente restano intatti così che i modelli vision possano ancora idratare immagini
  nuove.
- Il transcript grezzo della sessione non viene riscritto, quindi i visualizzatori della cronologia possono ancora
  renderizzare le voci originali dei messaggi e le loro immagini.
- Questo è separato dalla normale potatura TTL della cache. Esiste per impedire che payload di
  immagini ripetuti o riferimenti media obsoleti rompano le cache dei prompt nei turni successivi.

## Predefiniti intelligenti

OpenClaw abilita automaticamente la potatura per i profili Anthropic:

| Tipo di profilo                                        | Potatura abilitata | Heartbeat |
| ------------------------------------------------------ | ------------------ | --------- |
| Auth OAuth/token Anthropic (incluso il riuso di Claude CLI) | Sì                 | 1 ora     |
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

|            | Potatura              | Compaction              |
| ---------- | --------------------- | ----------------------- |
| **Cosa**   | Riduce i risultati degli strumenti | Riassume la conversazione |
| **Salvata?** | No (per richiesta)  | Sì (nel transcript)     |
| **Ambito** | Solo risultati degli strumenti | Intera conversazione     |

Si completano a vicenda -- la potatura mantiene snelli gli output degli strumenti tra
i cicli di Compaction.

## Approfondimenti

- [Compaction](/it/concepts/compaction) -- riduzione del contesto basata sul riassunto
- [Configurazione Gateway](/it/gateway/configuration) -- tutti i parametri di configurazione della potatura
  (`contextPruning.*`)

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Strumenti della sessione](/it/concepts/session-tool)
- [Motore di contesto](/it/concepts/context-engine)
