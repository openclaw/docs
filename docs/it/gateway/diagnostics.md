---
read_when:
    - Preparare una segnalazione di bug o una richiesta di supporto
    - Risoluzione dei problemi relativi ad arresti anomali, riavvii, pressione sulla memoria o carichi utili sovradimensionati del Gateway
    - Esaminare quali dati diagnostici vengono registrati o oscurati
summary: Creare bundle diagnostici Gateway condivisibili per le segnalazioni di bug
title: Esportazione diagnostica
x-i18n:
    generated_at: "2026-04-30T08:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw può creare un file zip diagnostico locale per le segnalazioni di bug. Combina
stato, integrità, log, forma della configurazione e recenti eventi di stabilità
senza payload del Gateway, tutti sanificati.

Tratta i pacchetti diagnostici come segreti finché non li hai esaminati. Sono
progettati per omettere o oscurare payload e credenziali, ma riassumono comunque
i log del Gateway locale e lo stato runtime a livello host.

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
conversazione reale e vuoi un report copiabile e incollabile per il supporto:

1. Invia `/diagnostics` nella conversazione in cui hai notato il problema. Aggiungi una
   breve nota se utile, per esempio `/diagnostics bad tool choice`.
2. OpenClaw invia il preambolo diagnostico e chiede un'approvazione exec
   esplicita. L'approvazione esegue `openclaw gateway diagnostics export --json`.
   Non approvare la diagnostica tramite una regola allow-all.
3. Dopo l'approvazione, OpenClaw risponde con un report incollabile contenente il
   percorso del pacchetto locale, il riepilogo del manifest, le note sulla privacy
   e gli id di sessione pertinenti.

Nelle chat di gruppo, un proprietario può comunque eseguire `/diagnostics`, ma
OpenClaw non pubblica i dettagli diagnostici nella chat condivisa. Invia il
preambolo, le richieste di approvazione, il risultato dell'esportazione del
Gateway e la scomposizione di sessione/thread Codex al proprietario tramite il
percorso di approvazione privato. Il gruppo riceve solo una breve notifica che
il flusso diagnostico è stato inviato privatamente. Se OpenClaw non riesce a
trovare un percorso privato verso il proprietario, il comando fallisce in modo
chiuso e chiede al proprietario di eseguirlo da un DM.

Quando la sessione OpenClaw attiva usa l'harness OpenAI Codex nativo,
la stessa approvazione exec copre anche un caricamento di feedback OpenAI per i
thread runtime Codex di cui OpenClaw è a conoscenza. Quel caricamento è separato
dal file zip locale del Gateway e compare solo per le sessioni con harness Codex.
Prima dell'approvazione, il prompt spiega che approvare la diagnostica invierà
anche feedback Codex, ma non elenca gli id di sessione o thread Codex. Dopo
l'approvazione, la risposta in chat elenca i canali, gli id di sessione OpenClaw,
gli id thread Codex e i comandi di ripresa locali per i thread inviati ai server
OpenAI. Se neghi o ignori l'approvazione, OpenClaw non esegue l'esportazione, non
invia feedback Codex e non stampa gli id Codex.

Questo rende breve il loop di debug Codex più comune: nota il comportamento
errato in Telegram, Discord o un altro canale, esegui `/diagnostics`, approva una
volta, condividi il report con il supporto, quindi esegui localmente il comando
`codex resume <thread-id>` stampato se vuoi ispezionare direttamente il thread
Codex nativo. Consulta
[Harness Codex](/it/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) per
quel flusso di ispezione.

## Cosa contiene l'esportazione

Il file zip include:

- `summary.md`: panoramica leggibile per il supporto.
- `diagnostics.json`: riepilogo leggibile da macchina di configurazione, log, stato, integrità
  e dati di stabilità.
- `manifest.json`: metadati di esportazione ed elenco dei file.
- Forma della configurazione sanificata e dettagli di configurazione non segreti.
- Riepiloghi dei log sanificati e righe di log recenti oscurate.
- Snapshot best-effort di stato e integrità del Gateway.
- `stability/latest.json`: pacchetto di stabilità persistito più recente, quando disponibile.

L'esportazione è utile anche quando il Gateway non è integro. Se il Gateway non
può rispondere alle richieste di stato o integrità, i log locali, la forma della
configurazione e il pacchetto di stabilità più recente vengono comunque raccolti
quando disponibili.

## Modello di privacy

La diagnostica è progettata per essere condivisibile. L'esportazione conserva
dati operativi utili al debug, come:

- nomi dei sottosistemi, id Plugin, id provider, id canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della coda e letture di memoria
- metadati dei log sanificati e messaggi operativi oscurati
- forma della configurazione e impostazioni di funzionalità non segrete

L'esportazione omette o oscura:

- testo delle chat, prompt, istruzioni, corpi webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi grezzi di richieste o risposte
- id account, id messaggio, id sessione grezzi, nomi host e nomi utente locali

Quando un messaggio di log sembra testo di payload utente, chat, prompt o
strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso
e il conteggio dei byte.

## Registratore di stabilità

Il Gateway registra per impostazione predefinita uno stream di stabilità limitato
e senza payload quando la diagnostica è abilitata. È pensato per fatti operativi,
non per contenuti.

Lo stesso Heartbeat diagnostico registra avvisi di vivacità quando il Gateway
continua a funzionare ma l'event loop di Node.js o la CPU sembra saturata. Questi
eventi `diagnostic.liveness.warning` includono ritardo dell'event loop, utilizzo
dell'event loop, rapporto tra core CPU e conteggi di sessioni attive/in attesa/in
coda. Non riavviano il Gateway da soli.

Ispeziona il registratore live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il pacchetto di stabilità persistito più recente dopo un'uscita fatale,
un timeout di arresto o un errore di avvio del riavvio:

```bash
openclaw gateway stability --bundle latest
```

Crea un file zip diagnostico dal pacchetto persistito più recente:

```bash
openclaw gateway stability --bundle latest --export
```

I pacchetti persistiti si trovano in `~/.openclaw/logs/stability/` quando
esistono eventi.

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
- `--no-stability-bundle`: salta la ricerca del pacchetto di stabilità persistito.
- `--json`: stampa metadati di esportazione leggibili da macchina.

## Disabilitare la diagnostica

La diagnostica è abilitata per impostazione predefinita. Per disabilitare il
registratore di stabilità e la raccolta degli eventi diagnostici:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Disabilitare la diagnostica riduce il dettaglio delle segnalazioni di bug. Non
influisce sulla normale registrazione dei log del Gateway.

## Correlati

- [Controlli di integrità](/it/gateway/health)
- [CLI del Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo del Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — flusso separato per inviare diagnostica in streaming a un collector
