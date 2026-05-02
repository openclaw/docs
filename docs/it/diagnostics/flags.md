---
read_when:
    - Sono necessari log di debug mirati senza aumentare i livelli globali di logging
    - È necessario acquisire i log specifici del sottosistema per l'assistenza
summary: Flag di diagnostica per log di debug mirati
title: Flag di diagnostica
x-i18n:
    generated_at: "2026-05-02T08:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

I flag di diagnostica consentono di abilitare log di debug mirati senza attivare la registrazione dettagliata ovunque. I flag sono opt-in e non hanno effetto a meno che un sottosistema non li controlli.

## Come funziona

- I flag sono stringhe (senza distinzione tra maiuscole e minuscole).
- Puoi abilitare i flag nella configurazione o tramite un override env.
- I caratteri jolly sono supportati:
  - `telegram.*` corrisponde a `telegram.http`
  - `*` abilita tutti i flag

## Abilitare tramite configurazione

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Più flag:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Riavvia il gateway dopo aver modificato i flag.

## Override env (una tantum)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Disabilitare tutti i flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefatti della timeline

Il flag `timeline` scrive eventi strutturati di avvio e temporizzazione runtime per
harness QA esterni:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Puoi abilitarlo anche nella configurazione:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Il percorso del file della timeline proviene comunque da
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quando `timeline` è abilitato solo dalla
configurazione, i primi intervalli di caricamento della configurazione non vengono emessi perché OpenClaw
non ha ancora letto la configurazione; gli intervalli di avvio successivi usano il flag di configurazione.

Anche `OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` e
`OPENCLAW_DIAGNOSTICS=*` abilitano la timeline perché abilitano ogni
flag di diagnostica. Preferisci `timeline` quando vuoi solo l'artefatto di temporizzazione
JSONL.

I record della timeline usano l'involucro `openclaw.diagnostics.v1`. Gli eventi possono includere
ID di processo, nomi di fase, nomi di intervallo, durate, ID di plugin, conteggi delle dipendenze,
campioni di ritardo dell'event loop, nomi di operazioni provider, stato di uscita dei processi figlio
e nomi/messaggi degli errori di avvio. Tratta i file della timeline come artefatti di diagnostica
locali; esaminali prima di condividerli fuori dalla tua macchina.

## Dove vanno i log

I flag emettono log nel file di log di diagnostica standard. Per impostazione predefinita:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se imposti `logging.file`, usa invece quel percorso. I log sono JSONL (un oggetto JSON per riga). La redazione si applica comunque in base a `logging.redactSensitive`.

## Estrarre i log

Scegli il file di log più recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtra per la diagnostica HTTP di Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtra per la diagnostica HTTP di Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Oppure segui il log mentre riproduci il problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Per i gateway remoti, puoi anche usare `openclaw logs --follow` (vedi [/cli/logs](/it/cli/logs)).

## Note

- Se `logging.level` è impostato su un valore superiore a `warn`, questi log potrebbero essere soppressi. Il valore predefinito `info` va bene.
- `brave.http` registra URL/parametri di query delle richieste Brave Search, stato/tempi delle risposte ed eventi di hit/miss/scrittura della cache. Non registra chiavi API o corpi delle risposte, ma le query di ricerca possono essere sensibili.
- I flag possono essere lasciati abilitati in sicurezza; influiscono solo sul volume dei log per il sottosistema specifico.
- Usa [/logging](/it/logging) per modificare destinazioni, livelli e redazione dei log.

## Correlati

- [Diagnostica del gateway](/it/gateway/diagnostics)
- [Risoluzione dei problemi del gateway](/it/gateway/troubleshooting)
