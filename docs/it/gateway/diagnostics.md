---
read_when:
    - Preparare un bug report o una richiesta di supporto
    - Debug di crash del Gateway, riavvii, pressione della memoria o payload sovradimensionati
    - Esaminare quali dati diagnostici vengono registrati o redatti
summary: Creare bundle diagnostici del Gateway condivisibili per i bug report
title: Esportazione della diagnostica
x-i18n:
    generated_at: "2026-04-24T08:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw può creare uno zip diagnostico locale sicuro da allegare ai bug
report. Combina stato, health, log, forma della configurazione e
recenti eventi di stabilità privi di payload del Gateway sanitizzati.

## Avvio rapido

```bash
openclaw gateway diagnostics export
```

Il comando stampa il percorso dello zip scritto. Per scegliere un percorso:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Per l'automazione:

```bash
openclaw gateway diagnostics export --json
```

## Cosa contiene l'esportazione

Lo zip include:

- `summary.md`: panoramica leggibile per gli umani per il supporto.
- `diagnostics.json`: riepilogo leggibile dalla macchina di configurazione, log, stato, health
  e dati di stabilità.
- `manifest.json`: metadati dell'export ed elenco dei file.
- Forma della configurazione sanitizzata e dettagli di configurazione non segreti.
- Riepiloghi dei log sanitizzati e recenti righe di log redatte.
- Snapshot best-effort di stato e health del Gateway.
- `stability/latest.json`: il bundle di stabilità persistito più recente, quando disponibile.

L'export è utile anche quando il Gateway non è in salute. Se il Gateway non può
rispondere alle richieste di stato o health, i log locali, la forma della configurazione e il bundle
di stabilità più recente vengono comunque raccolti quando disponibili.

## Modello di privacy

La diagnostica è progettata per essere condivisibile. L'export mantiene dati operativi
utili al debug, come:

- nomi dei sottosistemi, ID plugin, ID provider, ID canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della coda e letture di memoria
- metadati di log sanitizzati e messaggi operativi redatti
- forma della configurazione e impostazioni di funzionalità non segrete

L'export omette o redige:

- testo della chat, prompt, istruzioni, corpi webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi raw di richieste o risposte
- ID account, ID messaggi, ID sessione raw, hostname e nomi utente locali

Quando un messaggio di log sembra testo payload di utente, chat, prompt o strumenti, l'export
mantiene solo il fatto che un messaggio è stato omesso e il conteggio dei byte.

## Recorder di stabilità

Il Gateway registra per impostazione predefinita uno stream di stabilità delimitato e privo di payload quando
la diagnostica è abilitata. Serve per fatti operativi, non per contenuti.

Ispeziona il recorder live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il bundle di stabilità persistito più recente dopo un'uscita fatale, un
timeout di shutdown o un fallimento di avvio dopo un riavvio:

```bash
openclaw gateway stability --bundle latest
```

Crea uno zip diagnostico dal bundle persistito più recente:

```bash
openclaw gateway stability --bundle latest --export
```

I bundle persistiti si trovano sotto `~/.openclaw/logs/stability/` quando esistono eventi.

## Opzioni utili

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: scrive in un percorso zip specifico.
- `--log-lines <count>`: numero massimo di righe di log sanitizzate da includere.
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare.
- `--url <url>`: URL WebSocket del Gateway per gli snapshot di stato e health.
- `--token <token>`: token del Gateway per gli snapshot di stato e health.
- `--password <password>`: password del Gateway per gli snapshot di stato e health.
- `--timeout <ms>`: timeout degli snapshot di stato e health.
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa metadati dell'export leggibili dalla macchina.

## Disabilitare la diagnostica

La diagnostica è abilitata per impostazione predefinita. Per disabilitare il recorder di stabilità e
la raccolta degli eventi diagnostici:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Disabilitare la diagnostica riduce il dettaglio dei bug report. Non influisce sul
normale logging del Gateway.

## Documenti correlati

- [Health Checks](/it/gateway/health)
- [CLI del Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo del Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
