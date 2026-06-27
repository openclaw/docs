---
read_when:
    - Hai bisogno di log di debug mirati senza aumentare i livelli di logging globali
    - Devi acquisire i log specifici del sottosistema per il supporto
summary: Flag diagnostici per log di debug mirati
title: Flag di diagnostica
x-i18n:
    generated_at: "2026-06-27T17:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

I flag di diagnostica consentono di abilitare log di debug mirati senza attivare la registrazione dettagliata ovunque. I flag sono opt-in e non hanno effetto a meno che un sottosistema non li controlli.

## Come funziona

- I flag sono stringhe (senza distinzione tra maiuscole e minuscole).
- Puoi abilitare i flag nella configurazione o tramite una sovrascrittura env.
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

Riavvia il Gateway dopo aver modificato i flag.

## Sovrascrittura env (una tantum)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Disabilita tutti i flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` è una sovrascrittura di disabilitazione a livello di processo: disabilita
i flag sia da env sia dalla configurazione per quel processo.

## Flag di profilazione

I flag del profiler abilitano intervalli temporali mirati senza aumentare i
livelli di logging globali. Sono disabilitati per impostazione predefinita.

Abilita tutti gli intervalli protetti dal profiler per una singola esecuzione del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Abilita solo gli intervalli del profiler di invio delle risposte:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Abilita solo gli intervalli del profiler di avvio/tool/thread dell'app-server Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Abilita i flag del profiler dalla configurazione:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Riavvia il Gateway dopo aver modificato i flag di configurazione. Per disabilitare un flag del profiler,
rimuovilo da `diagnostics.flags` e riavvia. Per disabilitare temporaneamente ogni
flag di diagnostica anche quando la configurazione abilita i flag del profiler, avvia il processo con:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefatti della timeline

Il flag `timeline` scrive eventi temporali strutturati di avvio e runtime per
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

Il percorso del file timeline proviene comunque da
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quando `timeline` è abilitato solo dalla
configurazione, i primi intervalli di caricamento della configurazione non vengono emessi perché OpenClaw non ha
ancora letto la configurazione; gli intervalli di avvio successivi usano il flag di configurazione.

Anche `OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` e
`OPENCLAW_DIAGNOSTICS=*` abilitano la timeline perché abilitano ogni
flag di diagnostica. Preferisci `timeline` quando vuoi solo l'artefatto temporale
JSONL.

I record della timeline usano l'envelope `openclaw.diagnostics.v1`. Gli eventi possono includere
ID di processo, nomi di fase, nomi di intervallo, durate, ID dei plugin, conteggi delle dipendenze,
campioni di ritardo dell'event loop, nomi delle operazioni del provider, stato di uscita dei processi figli
e nomi/messaggi degli errori di avvio. Tratta i file timeline come artefatti di diagnostica locali;
rivedili prima di condividerli fuori dalla tua macchina.

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

Oppure segui la coda mentre riproduci:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Per Gateway remoti, puoi usare anche `openclaw logs --follow` (vedi [/cli/logs](/it/cli/logs)).

## Note

- Se `logging.level` è impostato su un valore più alto di `warn`, questi log potrebbero essere soppressi. Il valore predefinito `info` va bene.
- `brave.http` registra gli URL/i parametri di query delle richieste Brave Search, lo stato/la tempistica delle risposte e gli eventi di hit/miss/scrittura della cache. Non registra chiavi API o corpi delle risposte, ma le query di ricerca possono essere sensibili.
- I flag possono restare abilitati in sicurezza; influenzano solo il volume dei log per il sottosistema specifico.
- Usa [/logging](/it/logging) per modificare destinazioni, livelli e redazione dei log.

## Correlati

- [Diagnostica del Gateway](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
