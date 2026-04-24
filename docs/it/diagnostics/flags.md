---
read_when:
    - Ti servono log di debug mirati senza aumentare i livelli di log globali
    - Ti serve acquisire log specifici del sottosistema per il supporto
summary: Flag di diagnostica per log di debug mirati
title: Flag di diagnostica
x-i18n:
    generated_at: "2026-04-24T08:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

I flag di diagnostica ti consentono di abilitare log di debug mirati senza attivare il logging verboso ovunque. I flag sono opt-in e non hanno alcun effetto a meno che un sottosistema non li controlli.

## Come funziona

- I flag sono stringhe (case-insensitive).
- Puoi abilitare i flag nella configurazione o tramite un override env.
- I caratteri jolly sono supportati:
  - `telegram.*` corrisponde a `telegram.http`
  - `*` abilita tutti i flag

## Abilita tramite configurazione

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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Riavvia il Gateway dopo aver modificato i flag.

## Override env (una tantum)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Disattiva tutti i flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Dove finiscono i log

I flag emettono log nel file di log di diagnostica standard. Per impostazione predefinita:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se imposti `logging.file`, usa invece quel percorso. I log sono in formato JSONL (un oggetto JSON per riga). La redazione continua ad applicarsi in base a `logging.redactSensitive`.

## Estrai i log

Scegli il file di log più recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtra per la diagnostica HTTP di Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Oppure usa tail mentre riproduci il problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Per i Gateway remoti, puoi anche usare `openclaw logs --follow` (vedi [/cli/logs](/it/cli/logs)).

## Note

- Se `logging.level` è impostato su un valore più alto di `warn`, questi log possono essere soppressi. Il valore predefinito `info` va bene.
- I flag sono sicuri da lasciare abilitati; influenzano solo il volume dei log per il sottosistema specifico.
- Usa [/logging](/it/logging) per cambiare destinazioni dei log, livelli e redazione.

## Correlati

- [Diagnostica del Gateway](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
