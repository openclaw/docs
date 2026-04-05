---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi comprendere le modalità e le soglie di dreaming
    - Vuoi regolare il consolidamento senza inquinare `MEMORY.md`
summary: Promozione in background dal richiamo a breve termine alla memoria a lungo termine
title: Dreaming (sperimentale)
x-i18n:
    generated_at: "2026-04-05T13:49:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (sperimentale)

Dreaming è il passaggio di consolidamento della memoria in background in `memory-core`.

Si chiama "dreaming" perché il sistema rivisita ciò che è emerso durante la giornata
e decide cosa vale la pena conservare come contesto durevole.

Dreaming è **sperimentale**, **opt-in** e **disattivato per impostazione predefinita**.

## Cosa fa dreaming

1. Traccia gli eventi di richiamo a breve termine dagli hit di `memory_search` in
   `memory/YYYY-MM-DD.md`.
2. Valuta questi candidati di richiamo con segnali ponderati.
3. Promuove in `MEMORY.md` solo i candidati qualificati.

Questo mantiene la memoria a lungo termine concentrata su un contesto durevole e ripetuto invece che
su dettagli isolati.

## Segnali di promozione

Dreaming combina quattro segnali:

- **Frequenza**: quanto spesso è stato richiamato lo stesso candidato.
- **Rilevanza**: quanto erano forti i punteggi di richiamo quando è stato recuperato.
- **Diversità delle query**: quanti intenti di query distinti lo hanno fatto emergere.
- **Recenza**: ponderazione temporale sui richiami recenti.

La promozione richiede che tutte le soglie configurate vengano superate, non solo un segnale.

### Pesi dei segnali

| Segnale   | Peso | Descrizione                                      |
| --------- | ---- | ------------------------------------------------ |
| Frequenza | 0.35 | Quante volte è stata richiamata la stessa voce   |
| Rilevanza | 0.35 | Punteggi medi di richiamo quando viene recuperata |
| Diversità | 0.15 | Conteggio degli intenti di query distinti che la fanno emergere |
| Recenza   | 0.15 | Decadimento temporale (emivita di 14 giorni)     |

## Come funziona

1. **Tracciamento dei richiami** -- Ogni hit di `memory_search` viene registrato in
   `memory/.dreams/short-term-recall.json` con conteggio dei richiami, punteggi e hash
   della query.
2. **Valutazione pianificata** -- Con la cadenza configurata, i candidati vengono classificati
   usando segnali ponderati. Tutte le soglie devono essere superate contemporaneamente.
3. **Promozione** -- Le voci qualificate vengono aggiunte a `MEMORY.md` con un
   timestamp di promozione.
4. **Pulizia** -- Le voci già promosse vengono escluse dai cicli futuri. Un
   lock del file impedisce esecuzioni concorrenti.

## Modalità

`dreaming.mode` controlla la cadenza e le soglie predefinite:

| Modalità | Cadenza        | minScore | minRecallCount | minUniqueQueries |
| -------- | -------------- | -------- | -------------- | ---------------- |
| `off`    | Disabilitata   | --       | --             | --               |
| `core`   | Ogni giorno alle 3:00 | 0.75     | 3              | 2                |
| `rem`    | Ogni 6 ore     | 0.85     | 4              | 3                |
| `deep`   | Ogni 12 ore    | 0.80     | 3              | 3                |

## Modello di pianificazione

Quando dreaming è abilitato, `memory-core` gestisce automaticamente la pianificazione ricorrente.
Non è necessario creare manualmente un cron job per questa funzionalità.

Puoi comunque regolare il comportamento con override espliciti come:

- `dreaming.frequency` (espressione cron)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Configurazione

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## Comandi chat

Cambia modalità e controlla lo stato dalla chat:

```
/dreaming core          # Passa alla modalità core (notturna)
/dreaming rem           # Passa alla modalità rem (ogni 6 ore)
/dreaming deep          # Passa alla modalità deep (ogni 12 ore)
/dreaming off           # Disabilita dreaming
/dreaming status        # Mostra la configurazione corrente e la cadenza
/dreaming help          # Mostra la guida alle modalità
```

## Comandi CLI

Anteprima e applicazione delle promozioni dalla riga di comando:

```bash
# Anteprima dei candidati alla promozione
openclaw memory promote

# Applica le promozioni a MEMORY.md
openclaw memory promote --apply

# Limita il numero di elementi mostrati in anteprima
openclaw memory promote --limit 5

# Include le voci già promosse
openclaw memory promote --include-promoted

# Controlla lo stato di dreaming
openclaw memory status --deep
```

Vedi [memory CLI](/cli/memory) per il riferimento completo dei flag.

## UI Dreams

Quando dreaming è abilitato, la barra laterale del Gateway mostra una scheda **Dreams** con
statistiche della memoria (conteggio a breve termine, conteggio a lungo termine, conteggio delle promozioni) e l'orario del prossimo
ciclo pianificato.

## Approfondimenti

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Riferimento della configurazione della memoria](/reference/memory-config)
