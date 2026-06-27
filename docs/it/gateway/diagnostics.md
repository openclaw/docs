---
read_when:
    - Preparare una segnalazione di bug o una richiesta di supporto
    - Debug di crash, riavvii, pressione sulla memoria o payload sovradimensionati del Gateway
    - Esaminare quali dati diagnostici vengono registrati o oscurati
summary: Crea bundle diagnostici Gateway condivisibili per le segnalazioni di bug
title: Esportazione diagnostica
x-i18n:
    generated_at: "2026-06-27T17:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw può creare un file zip di diagnostica locale per le segnalazioni di bug. Combina
stato, integrità, log, forma della configurazione e eventi recenti di stabilità
senza payload del Gateway, in forma sanificata.

Tratta i bundle di diagnostica come segreti finché non li hai esaminati. Sono
progettati per omettere o oscurare payload e credenziali, ma riassumono comunque
i log locali del Gateway e lo stato di runtime a livello host.

## Avvio rapido

```bash
openclaw gateway diagnostics export
```

Il comando stampa il percorso del file zip scritto. Per scegliere un percorso:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Per l'automazione:

```bash
openclaw gateway diagnostics export --json
```

## Comando chat

I proprietari possono usare `/diagnostics [note]` in chat per richiedere
un'esportazione locale del Gateway. Usalo quando il bug si è verificato in una
conversazione reale e vuoi un report unico, copiabile e incollabile, per il supporto:

1. Invia `/diagnostics` nella conversazione in cui hai notato il problema. Aggiungi
   una breve nota se utile, ad esempio `/diagnostics bad tool choice`.
2. OpenClaw invia il preambolo della diagnostica e richiede un'approvazione exec
   esplicita. L'approvazione esegue `openclaw gateway diagnostics export --json`.
   Non approvare la diagnostica tramite una regola allow-all.
3. Dopo l'approvazione, OpenClaw risponde con un report incollabile che contiene
   il percorso del bundle locale, il riepilogo del manifesto, note sulla privacy
   e gli id sessione pertinenti.

Nelle chat di gruppo, un proprietario può comunque eseguire `/diagnostics`, ma
OpenClaw non pubblica i dettagli diagnostici nella chat condivisa. Invia il
preambolo, le richieste di approvazione, il risultato dell'esportazione del
Gateway e la suddivisione di sessione/thread Codex al proprietario tramite il
percorso di approvazione privato. Il gruppo riceve solo un breve avviso che il
flusso di diagnostica è stato inviato privatamente. Se OpenClaw non riesce a
trovare un percorso privato per il proprietario, il comando fallisce in modo
chiuso e chiede al proprietario di eseguirlo da un DM.

Quando la sessione OpenClaw attiva usa l'harness OpenAI Codex nativo, la stessa
approvazione exec copre anche un caricamento di feedback OpenAI per i thread di
runtime Codex di cui OpenClaw è a conoscenza. Quel caricamento è separato dal file
zip locale del Gateway e appare solo per le sessioni dell'harness Codex. Prima
dell'approvazione, la richiesta spiega che l'approvazione della diagnostica
invierà anche feedback Codex, ma non elenca gli id sessione o thread Codex. Dopo
l'approvazione, la risposta in chat elenca i canali, gli id sessione OpenClaw,
gli id thread Codex e i comandi di ripresa locali per i thread inviati ai server
OpenAI. Se neghi o ignori l'approvazione, OpenClaw non esegue l'esportazione, non
invia feedback Codex e non stampa gli id Codex.

Questo rende breve il ciclo comune di debug Codex: nota il comportamento errato in
Telegram, Discord o un altro canale, esegui `/diagnostics`, approva una volta,
condividi il report con il supporto, quindi esegui localmente il comando stampato
`codex resume <thread-id>` se vuoi ispezionare tu stesso il thread Codex nativo.
Vedi [harness Codex](/it/plugins/codex-harness#inspect-codex-threads-locally) per
quel flusso di ispezione.

## Contenuto dell'esportazione

Il file zip include:

- `summary.md`: panoramica leggibile da persone per il supporto.
- `diagnostics.json`: riepilogo leggibile da macchina di configurazione, log,
  stato, integrità e dati di stabilità.
- `manifest.json`: metadati dell'esportazione ed elenco dei file.
- Forma della configurazione sanificata e dettagli di configurazione non segreti.
- Riepiloghi dei log sanificati e righe di log recenti oscurate.
- Snapshot best-effort di stato e integrità del Gateway.
- `stability/latest.json`: il bundle di stabilità persistito più recente, quando disponibile.

L'esportazione è utile anche quando il Gateway non è integro. Se il Gateway non
può rispondere alle richieste di stato o integrità, i log locali, la forma della
configurazione e l'ultimo bundle di stabilità vengono comunque raccolti quando
disponibili.

## Modello di privacy

La diagnostica è progettata per essere condivisibile. L'esportazione mantiene i
dati operativi utili al debug, come:

- nomi dei sottosistemi, id Plugin, id provider, id canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della coda e letture di memoria
- metadati dei log sanificati e messaggi operativi oscurati
- forma della configurazione e impostazioni di funzionalità non segrete

L'esportazione omette o oscura:

- testo della chat, prompt, istruzioni, corpi webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi grezzi di richieste o risposte
- id account, id messaggio, id sessione grezzi, nomi host e nomi utente locali

Quando un messaggio di log sembra testo di payload utente, chat, prompt o strumento,
l'esportazione mantiene solo l'indicazione che un messaggio è stato omesso e il
conteggio dei byte.

## Registratore di stabilità

Il Gateway registra per impostazione predefinita un flusso di stabilità limitato
e senza payload quando la diagnostica è abilitata. È destinato ai fatti operativi,
non ai contenuti.

Lo stesso heartbeat diagnostico registra campioni di attività quando il Gateway
continua a funzionare ma il loop eventi Node.js o la CPU sembrano saturi. Questi
eventi `diagnostic.liveness.warning` includono ritardo del loop eventi, utilizzo
del loop eventi, rapporto dei core CPU, conteggi di sessioni attive/in attesa/in
coda, la fase corrente di avvio/runtime quando nota, span di fase recenti ed
etichette limitate di lavoro attivo/in coda. I campioni inattivi restano nella
telemetria a livello `info`. I campioni di attività diventano avvisi del Gateway
solo quando del lavoro è in attesa o in coda, oppure quando lavoro attivo si
sovrappone a un ritardo sostenuto del loop eventi. I picchi transitori di ritardo
massimo durante lavoro in background altrimenti sano restano nei log di debug. Da
soli non riavviano il Gateway.

Le fasi di avvio emettono anche eventi `diagnostic.phase.completed` con tempi
wall-clock e CPU. La diagnostica di esecuzioni embedded bloccate imposta
`terminalProgressStale=true` quando l'ultimo avanzamento del bridge sembrava
terminale, come un elemento di risposta grezzo o un evento di completamento
risposta, ma il Gateway considera ancora attiva l'esecuzione embedded.

Ispeziona il registratore live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il bundle di stabilità persistito più recente dopo un'uscita fatale, un
timeout di arresto o un errore di avvio al riavvio:

```bash
openclaw gateway stability --bundle latest
```

Crea un file zip di diagnostica dal bundle persistito più recente:

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
- `--log-lines <count>`: numero massimo di righe di log sanificate da includere.
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare.
- `--url <url>`: URL WebSocket del Gateway per gli snapshot di stato e integrità.
- `--token <token>`: token del Gateway per gli snapshot di stato e integrità.
- `--password <password>`: password del Gateway per gli snapshot di stato e integrità.
- `--timeout <ms>`: timeout degli snapshot di stato e integrità.
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa metadati di esportazione leggibili da macchina.

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
influisce sul normale logging del Gateway.

Gli snapshot di pressione critica sulla memoria sono disattivati per impostazione
predefinita. Per mantenere gli eventi di diagnostica e acquisire anche lo snapshot
di stabilità pre-OOM:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Usalo solo su host che possono tollerare la scansione aggiuntiva del file system
e la scrittura dello snapshot durante pressione critica sulla memoria. I normali
eventi di pressione sulla memoria registrano comunque RSS, heap, soglia e fatti
di crescita quando lo snapshot è disattivato.

## Correlati

- [Controlli di integrità](/it/gateway/health)
- [CLI Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — flusso separato per inviare diagnostica in streaming a un collector
