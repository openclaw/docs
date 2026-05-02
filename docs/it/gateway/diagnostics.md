---
read_when:
    - Preparare una segnalazione di bug o una richiesta di supporto
    - Debug di crash, riavvii, pressione sulla memoria o payload sovradimensionati del Gateway
    - Esaminare quali dati diagnostici vengono registrati o oscurati
summary: Crea pacchetti di diagnostica Gateway condivisibili per le segnalazioni di bug
title: Esportazione della diagnostica
x-i18n:
    generated_at: "2026-05-02T08:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw può creare uno zip diagnostico locale per le segnalazioni di bug. Combina
stato, integrità, log, forma della configurazione del Gateway sanificati ed eventi
recenti di stabilità privi di payload.

Tratta i bundle diagnostici come segreti finché non li hai esaminati. Sono
progettati per omettere o oscurare payload e credenziali, ma riassumono comunque
i log locali del Gateway e lo stato di runtime a livello host.

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

## Comando chat

I proprietari possono usare `/diagnostics [note]` in chat per richiedere
un'esportazione del Gateway locale. Usalo quando il bug si è verificato in una
conversazione reale e vuoi un report copiabile per il supporto:

1. Invia `/diagnostics` nella conversazione in cui hai notato il problema. Aggiungi
   una breve nota se aiuta, per esempio `/diagnostics bad tool choice`.
2. OpenClaw invia il preambolo diagnostico e chiede un'unica approvazione exec
   esplicita. L'approvazione esegue `openclaw gateway diagnostics export --json`.
   Non approvare la diagnostica tramite una regola allow-all.
3. Dopo l'approvazione, OpenClaw risponde con un report incollabile contenente il
   percorso del bundle locale, il riepilogo del manifest, le note sulla privacy e
   gli id sessione pertinenti.

Nelle chat di gruppo, un proprietario può comunque eseguire `/diagnostics`, ma
OpenClaw non pubblica i dettagli diagnostici nella chat condivisa. Invia il
preambolo, le richieste di approvazione, il risultato dell'esportazione del
Gateway e la suddivisione di sessione/thread Codex al proprietario tramite il
percorso di approvazione privato. Il gruppo riceve solo un breve avviso che il
flusso diagnostico è stato inviato privatamente. Se OpenClaw non riesce a trovare
un percorso privato verso il proprietario, il comando fallisce in modo chiuso e
chiede al proprietario di eseguirlo da un DM.

Quando la sessione OpenClaw attiva usa l'harness nativo OpenAI Codex, la stessa
approvazione exec copre anche un caricamento di feedback OpenAI per i thread di
runtime Codex che OpenClaw conosce. Quel caricamento è separato dallo zip locale
del Gateway e compare solo per le sessioni con harness Codex. Prima
dell'approvazione, il prompt spiega che approvare la diagnostica invierà anche
feedback Codex, ma non elenca gli id di sessione o thread Codex. Dopo
l'approvazione, la risposta in chat elenca i canali, gli id sessione OpenClaw,
gli id thread Codex e i comandi locali di ripresa per i thread inviati ai server
OpenAI. Se neghi o ignori l'approvazione, OpenClaw non esegue l'esportazione, non
invia feedback Codex e non stampa gli id Codex.

Questo rende breve il ciclo comune di debug Codex: nota il comportamento errato
in Telegram, Discord o un altro canale, esegui `/diagnostics`, approva una volta,
condividi il report con il supporto, quindi esegui localmente il comando stampato
`codex resume <thread-id>` se vuoi esaminare personalmente il thread Codex
nativo. Vedi
[Harness Codex](/it/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) per
quel flusso di ispezione.

## Cosa contiene l'esportazione

Lo zip include:

- `summary.md`: panoramica leggibile da persone per il supporto.
- `diagnostics.json`: riepilogo leggibile da macchine di configurazione, log,
  stato, integrità e dati di stabilità.
- `manifest.json`: metadati dell'esportazione ed elenco dei file.
- Forma della configurazione sanificata e dettagli di configurazione non segreti.
- Riepiloghi dei log sanificati e righe di log recenti oscurate.
- Snapshot best-effort di stato e integrità del Gateway.
- `stability/latest.json`: il bundle di stabilità persistito più recente, quando disponibile.

L'esportazione è utile anche quando il Gateway non è integro. Se il Gateway non
può rispondere alle richieste di stato o integrità, i log locali, la forma della
configurazione e il bundle di stabilità più recente vengono comunque raccolti
quando disponibili.

## Modello di privacy

La diagnostica è progettata per essere condivisibile. L'esportazione conserva
dati operativi utili al debug, come:

- nomi di sottosistemi, id plugin, id provider, id canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della coda e letture della memoria
- metadati dei log sanificati e messaggi operativi oscurati
- forma della configurazione e impostazioni di funzionalità non segrete

L'esportazione omette o oscura:

- testo della chat, prompt, istruzioni, corpi webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi grezzi di richieste o risposte
- id account, id messaggio, id sessione grezzi, nomi host e nomi utente locali

Quando un messaggio di log sembra testo di payload utente, chat, prompt o
strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso
e il conteggio dei byte.

## Registratore di stabilità

Il Gateway registra per impostazione predefinita uno stream di stabilità limitato
e privo di payload quando la diagnostica è abilitata. Serve per fatti operativi,
non per contenuti.

Lo stesso Heartbeat diagnostico registra campioni di attività quando il Gateway
continua a funzionare ma il ciclo degli eventi Node.js o la CPU sembrano saturi.
Questi eventi `diagnostic.liveness.warning` includono ritardo del ciclo degli
eventi, utilizzo del ciclo degli eventi, rapporto dei core CPU e conteggi delle
sessioni attive/in attesa/in coda. I campioni inattivi restano nella telemetria a
livello `info`; vengono registrati come avvisi del Gateway solo quando il lavoro
diagnostico è attivo, in attesa o in coda. Non riavviano il Gateway da soli.

Ispeziona il registratore live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il bundle di stabilità persistito più recente dopo un'uscita fatale,
un timeout di spegnimento o un errore di avvio dopo riavvio:

```bash
openclaw gateway stability --bundle latest
```

Crea uno zip diagnostico dal bundle persistito più recente:

```bash
openclaw gateway stability --bundle latest --export
```

I bundle persistiti si trovano in `~/.openclaw/logs/stability/` quando esistono eventi.

## Opzioni utili

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: scrive in un percorso zip specifico.
- `--log-lines <count>`: numero massimo di righe di log sanificate da includere.
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare.
- `--url <url>`: URL WebSocket del Gateway per snapshot di stato e integrità.
- `--token <token>`: token del Gateway per snapshot di stato e integrità.
- `--password <password>`: password del Gateway per snapshot di stato e integrità.
- `--timeout <ms>`: timeout degli snapshot di stato e integrità.
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa metadati dell'esportazione leggibili da macchine.

## Disabilitare la diagnostica

La diagnostica è abilitata per impostazione predefinita. Per disabilitare il
registratore di stabilità e la raccolta di eventi diagnostici:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Disabilitare la diagnostica riduce i dettagli delle segnalazioni di bug. Non
influisce sulla normale registrazione dei log del Gateway.

## Correlati

- [Controlli di integrità](/it/gateway/health)
- [CLI Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — flusso separato per inviare diagnostica in streaming a un collector
