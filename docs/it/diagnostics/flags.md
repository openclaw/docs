---
read_when:
    - Hai bisogno di log di debug mirati senza aumentare i livelli di logging globali
    - Hai bisogno di acquisire log specifici del sottosistema per il supporto
summary: Flag di diagnostica per log di debug mirati
title: Flag di diagnostica
x-i18n:
    generated_at: "2026-04-05T13:50:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Flag di diagnostica

I flag di diagnostica ti permettono di abilitare log di debug mirati senza attivare il logging dettagliato ovunque. I flag sono opt-in e non hanno effetto a meno che un sottosistema non li controlli.

## Come funziona

- I flag sono stringhe (senza distinzione tra maiuscole e minuscole).
- Puoi abilitare i flag nella configurazione o tramite un override env.
- I wildcard sono supportati:
  - `telegram.*` corrisponde a `telegram.http`
  - `*` abilita tutti i flag

## Abilitazione tramite configurazione

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

Riavvia il gateway dopo aver modificato i flag.

## Override env (una tantum)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Disabilita tutti i flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Dove finiscono i log

I flag emettono log nel file di log di diagnostica standard. Per impostazione predefinita:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se imposti `logging.file`, usa invece quel percorso. I log sono in formato JSONL (un oggetto JSON per riga). L'oscuramento si applica comunque in base a `logging.redactSensitive`.

## Estrazione dei log

Scegli l'ultimo file di log:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtra per la diagnostica HTTP di Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Oppure seguili mentre riproduci il problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Per i gateway remoti, puoi anche usare `openclaw logs --follow` (vedi [/cli/logs](/cli/logs)).

## Note

- Se `logging.level` è impostato a un valore superiore a `warn`, questi log potrebbero essere soppressi. Il valore predefinito `info` va bene.
- È sicuro lasciare i flag abilitati; influenzano solo il volume dei log per il sottosistema specifico.
- Usa [/logging](/logging) per modificare destinazioni dei log, livelli e oscuramento.
