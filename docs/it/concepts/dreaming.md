---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi regolare il consolidamento senza inquinare MEMORY.md
summary: Consolidamento della memoria in background con fasi light, deep e REM più un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T08:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`.
Aiuta OpenClaw a spostare segnali forti di breve termine nella memoria durevole mantenendo
il processo spiegabile e verificabile.

Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (recall store, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile dall'uomo** in `DREAMS.md` (o `dreams.md` esistente) e file di report opzionali per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello a fasi

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                     | Scrittura durevole |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordina e prepara il materiale recente di breve termine | No                 |
| Deep  | Valuta e promuove i candidati durevoli    | Sì (`MEMORY.md`)   |
| REM   | Riflette su temi e idee ricorrenti        | No                 |

Queste fasi sono dettagli interni di implementazione, non "modalità"
separate configurate dall'utente.

### Fase Light

La fase Light acquisisce i recenti segnali di memoria giornalieri e le tracce di recall, li deduplica
e prepara le righe candidate.

- Legge dallo stato di recall a breve termine, dai file di memoria giornalieri recenti e dalle trascrizioni di sessione redatte quando disponibili.
- Scrive un blocco gestito `## Light Sleep` quando lo storage include output inline.
- Registra segnali di rinforzo per il ranking deep successivo.
- Non scrive mai in `MEMORY.md`.

### Fase Deep

La fase Deep decide cosa diventa memoria a lungo termine.

- Classifica i candidati usando punteggi pesati e soglie di accesso.
- Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata gli snippet dai file giornalieri live prima della scrittura, così gli snippet obsoleti/eliminati vengono saltati.
- Aggiunge le voci promosse a `MEMORY.md`.
- Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM estrae pattern e segnali riflessivi.

- Costruisce riepiloghi di temi e riflessioni a partire dalle recenti tracce di breve termine.
- Scrive un blocco gestito `## REM Sleep` quando lo storage include output inline.
- Registra segnali di rinforzo REM usati dal ranking deep.
- Non scrive mai in `MEMORY.md`.

## Ingestione delle trascrizioni di sessione

Dreaming può acquisire trascrizioni di sessione redatte nel corpus di Dreaming. Quando
le trascrizioni sono disponibili, vengono introdotte nella fase Light insieme ai segnali
di memoria giornalieri e alle tracce di recall. I contenuti personali e sensibili vengono redatti
prima dell'ingestione.

## Dream Diary

Dreaming mantiene anche un **Dream Diary** narrativo in `DREAMS.md`.
Dopo che ogni fase ha materiale sufficiente, `memory-core` esegue un turno di subagente in background
best-effort (usando il modello runtime predefinito) e aggiunge una breve voce di diario.

Questo diario è pensato per la lettura umana nella UI Dreams, non come sorgente di promozione.
Gli artefatti di diario/report generati da Dreaming sono esclusi dalla
promozione a breve termine. Solo gli snippet di memoria fondati possono essere promossi in
`MEMORY.md`.

Esiste anche una corsia di backfill storico fondato per lavoro di revisione e recupero:

- `memory rem-harness --path ... --grounded` mostra in anteprima l'output del diario fondato dalle note storiche `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` scrive voci di diario fondate e reversibili in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso archivio di evidenze a breve termine già usato dalla normale fase deep.
- `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono questi artefatti di backfill preparati senza toccare le normali voci di diario o il recall live a breve termine.

La UI Control espone lo stesso flusso di backfill/reset del diario così puoi ispezionare
i risultati nella scena Dreams prima di decidere se i candidati fondati
meritano la promozione. La Scene mostra anche una corsia fondata distinta così puoi vedere
quali voci preparate a breve termine provengono dal replay storico, quali elementi promossi sono stati guidati dal contenuto fondato e cancellare solo le voci preparate esclusivamente fondate senza
toccare il normale stato live a breve termine.

## Segnali di ranking Deep

Il ranking deep usa sei segnali base pesati più il rinforzo di fase:

| Segnale             | Peso | Descrizione                                        |
| ------------------- | ---- | -------------------------------------------------- |
| Frequenza           | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza           | 0.30 | Qualità media di recupero per la voce              |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza             | 0.15 | Punteggio di freschezza con decadimento temporale  |
| Consolidamento      | 0.10 | Forza di ricorrenza su più giorni                  |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso    |

Gli hit delle fasi Light e REM aggiungono un piccolo boost con decadimento di recenza da
`memory/.dreams/phase-signals.json`.

## Pianificazione

Quando è abilitato, `memory-core` gestisce automaticamente un processo Cron per una sweep completa di Dreaming.
Ogni sweep esegue le fasi in ordine: light -> REM -> deep.

Comportamento predefinito della cadenza:

| Impostazione         | Predefinito |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Avvio rapido

Abilita Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Abilita Dreaming con una cadenza sweep personalizzata:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flusso CLI

Usa la promozione CLI per anteprima o applicazione manuale:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase deep, salvo override
tramite flag CLI.

Spiega perché un candidato specifico verrebbe o non verrebbe promosso:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Mostra in anteprima riflessioni REM, verità candidate e output di promozione deep senza
scrivere nulla:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valori predefiniti chiave

Tutte le impostazioni risiedono in `plugins.entries.memory-core.config.dreaming`.

| Chiave      | Predefinito |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La policy di fase, le soglie e il comportamento dello storage sono dettagli interni di implementazione
(non configurazione esposta all'utente).

Vedi [Riferimento alla configurazione Memory](/it/reference/memory-config#dreaming)
per l'elenco completo delle chiavi.

## UI Dreams

Quando è abilitata, la scheda **Dreams** del Gateway mostra:

- stato corrente di abilitazione di Dreaming
- stato a livello di fase e presenza della sweep gestita
- conteggi di breve termine, fondati, segnali e promossi oggi
- tempistica della prossima esecuzione pianificata
- una corsia Scene fondata distinta per le voci di replay storico preparate
- un lettore Dream Diary espandibile supportato da `doctor.memory.dreamDiary`

## Risoluzione dei problemi

### Dreaming non viene mai eseguito (lo stato mostra blocked)

Il processo Cron gestito di Dreaming viaggia sull'Heartbeat dell'agente predefinito. Se Heartbeat non si attiva per quell'agente, il processo Cron accoda un evento di sistema che nessuno consuma e Dreaming silenziosamente non viene eseguito. Sia `openclaw memory status` sia `/dreaming status` riporteranno `blocked` in quel caso e indicheranno l'agente il cui Heartbeat è il blocco.

Due cause comuni:

- Un altro agente dichiara un blocco `heartbeat:` esplicito. Quando una qualunque voce in `agents.list` ha un proprio blocco `heartbeat`, solo quegli agenti eseguono Heartbeat — i valori predefiniti smettono di applicarsi a tutti, quindi l'agente predefinito può diventare silenzioso. Sposta le impostazioni Heartbeat in `agents.defaults.heartbeat`, oppure aggiungi un blocco `heartbeat` esplicito sull'agente predefinito. Vedi [Ambito e precedenza](/it/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` è `0`, vuoto o non analizzabile. Il processo Cron non ha alcun intervallo rispetto a cui pianificare, quindi Heartbeat è di fatto disabilitato. Imposta `every` su una durata positiva come `30m`. Vedi [Valori predefiniti](/it/gateway/heartbeat#defaults).

## Correlati

- [Heartbeat](/it/gateway/heartbeat)
- [Memory](/it/concepts/memory)
- [Memory Search](/it/concepts/memory-search)
- [CLI memory](/it/cli/memory)
- [Riferimento alla configurazione Memory](/it/reference/memory-config)
