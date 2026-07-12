---
read_when:
    - Hai bisogno di log di debug mirati senza aumentare i livelli di logging globali
    - Devi acquisire i log specifici del sottosistema per l'assistenza
summary: Flag di diagnostica per log di debug mirati
title: Flag di diagnostica
x-i18n:
    generated_at: "2026-07-12T07:01:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

I flag di diagnostica attivano registrazioni aggiuntive per un sottosistema senza aumentare globalmente
`logging.level`. Un flag non ha effetto a meno che un sottosistema non lo verifichi.

## Funzionamento

- I flag sono stringhe senza distinzione tra maiuscole e minuscole, risolte da `diagnostics.flags` nella
  configurazione insieme alla sovrascrittura tramite la variabile di ambiente `OPENCLAW_DIAGNOSTICS`, quindi deduplicate e convertite in minuscolo.
- `name.*` corrisponde a `name` stesso e a qualsiasi elemento sotto `name.` (ad esempio
  `telegram.*` corrisponde a `telegram.http`).
- `*` o `all` abilita tutti i flag.
- Riavvia il Gateway dopo aver modificato `diagnostics.flags` nella configurazione; la modifica non viene
  ricaricata a caldo.

## Flag noti

| Flag             | Abilita                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `telegram.http`  | Registrazione degli errori HTTP dell'API Telegram Bot             |
| `brave.http`     | Registrazione di richieste, risposte e cache di Brave Search      |
| `profiler`       | Profiler della fase di risposta e dell'app-server Codex (entrambi) |
| `reply.profiler` | Solo il profiler della fase di risposta                           |
| `codex.profiler` | Solo il profiler dell'app-server Codex                            |
| `timeline`       | Artefatto della cronologia strutturato in JSONL (vedi sotto)      |

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
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Sovrascrittura tramite variabile di ambiente (occasionale)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

I valori vengono separati in corrispondenza di virgole o spazi. Valori speciali:

| Valore                      | Effetto                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Disabilita tutti i flag, sovrascrivendo anche la configurazione |
| `1`, `true`, `all`, `*`     | Abilita tutti i flag                                            |

`OPENCLAW_DIAGNOSTICS=0` disabilita i flag provenienti sia dalla variabile di ambiente sia dalla configurazione per quel
processo; è utile per silenziare temporaneamente un flag del profiler rimasto attivo nella configurazione
senza modificare il file.

## Flag del profiler

I flag del profiler controllano intervalli di temporizzazione leggeri; quando sono disattivati non aggiungono alcun sovraccarico.

Abilita tutti gli intervalli controllati dal profiler per una singola esecuzione del Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Abilita solo gli intervalli del profiler per l'invio delle risposte:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Abilita solo gli intervalli del profiler per avvio, strumenti e thread dell'app-server Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` abilita sia il profiler delle risposte sia quello di Codex; usa i nomi
dei flag con ambito specifico per abilitarne solo uno.

In alternativa, impostalo nella configurazione:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Riavvia il Gateway dopo aver modificato i flag nella configurazione. Per disabilitare un flag del profiler,
rimuovilo da `diagnostics.flags` e riavvia, oppure avvia il processo con
`OPENCLAW_DIAGNOSTICS=0` per sovrascrivere tutti i flag di diagnostica per quella esecuzione.

## Artefatti della cronologia

Il flag `timeline` (alias: `diagnostics.timeline`) scrive gli eventi strutturati di temporizzazione
dell'avvio e dell'esecuzione in formato JSONL, per sistemi esterni di controllo qualità:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

In alternativa, abilitalo nella configurazione:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Il percorso di output proviene sempre da `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, anche
quando il flag stesso è impostato nella configurazione; non esiste una chiave di configurazione per il percorso.
Quando `timeline` è abilitato solo dalla configurazione, i primi intervalli di caricamento della configurazione
sono assenti perché OpenClaw non ha ancora letto la configurazione; gli intervalli di avvio successivi
vengono acquisiti normalmente.

Anche `OPENCLAW_DIAGNOSTICS=1`, `=all` e `=*` abilitano la cronologia, poiché
abilitano tutti i flag. Preferisci il flag specifico `timeline` quando desideri solo
l'artefatto JSONL e non tutti gli altri flag di diagnostica.

I campioni di ritardo del ciclo degli eventi nella cronologia richiedono un'ulteriore abilitazione oltre a
`timeline`: imposta `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (oppure `on`/`true`/`yes`) oltre
ad abilitare la cronologia.

I record della cronologia utilizzano l'involucro `openclaw.diagnostics.v1` e possono includere
identificativi dei processi, nomi delle fasi, nomi degli intervalli, durate, identificativi dei Plugin, conteggi
delle dipendenze, campioni di ritardo del ciclo degli eventi, nomi delle operazioni dei provider, stato di uscita
dei processi figli e nomi/messaggi degli errori di avvio. Considera i file della cronologia come
artefatti diagnostici locali; esaminali prima di condividerli all'esterno del tuo computer.

## Destinazione dei log

I flag emettono log nel file di log diagnostico standard. Per impostazione predefinita:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se imposti `logging.file`, usa invece quel percorso. I log sono in formato JSONL (un oggetto JSON
per riga). L'oscuramento continua ad applicarsi in base a `logging.redactSensitive`.
Consulta [Registrazione](/it/logging) per il modello completo di risoluzione del percorso dei log, rotazione e
oscuramento.

## Estrazione dei log

Seleziona il file di log più recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtra la diagnostica HTTP di Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtra la diagnostica HTTP di Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Oppure segui il log durante la riproduzione:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Per i Gateway remoti, usa invece `openclaw logs --follow` (consulta
[/cli/logs](/it/cli/logs)).

## Note

- Se `logging.level` è impostato su un livello superiore a `warn`, i log controllati dai flag potrebbero essere
  soppressi. Il valore predefinito `info` va bene.
- `brave.http` registra gli URL e i parametri di query delle richieste di Brave Search, lo stato e la temporizzazione
  delle risposte e gli eventi di successo, mancato riscontro e scrittura nella cache. Non registra la chiave API
  (inviata come intestazione della richiesta) né i corpi delle risposte, ma le query di ricerca possono essere
  sensibili.
- I flag possono essere lasciati abilitati in sicurezza; influiscono solo sul volume dei log dello
  specifico sottosistema.
- Usa [/logging](/it/logging) per modificare destinazioni, livelli e oscuramento dei log.

## Contenuti correlati

- [Diagnostica del Gateway](/it/gateway/diagnostics)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
