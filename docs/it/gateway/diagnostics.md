---
read_when:
    - Preparazione di una segnalazione di bug o di una richiesta di supporto
    - Debug di arresti anomali, riavvii, pressione sulla memoria o payload sovradimensionati del Gateway
    - Esaminare quali dati diagnostici vengono registrati o oscurati
summary: Creare bundle diagnostici Gateway condivisibili per le segnalazioni di bug
title: Esportazione della diagnostica
x-i18n:
    generated_at: "2026-05-03T21:32:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw può creare un file zip di diagnostica locale per le segnalazioni di bug. Combina
stato, salute, log, struttura della configurazione ed eventi recenti di stabilità privi
di payload del Gateway, tutti sanitizzati.

Tratta i bundle diagnostici come segreti finché non li hai esaminati. Sono
progettati per omettere o oscurare payload e credenziali, ma riassumono comunque
i log locali del Gateway e lo stato di runtime a livello di host.

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

I proprietari possono usare `/diagnostics [note]` in chat per richiedere un'esportazione locale del Gateway.
Usalo quando il bug si è verificato in una conversazione reale e vuoi un unico
report copiabile e incollabile per il supporto:

1. Invia `/diagnostics` nella conversazione in cui hai notato il problema. Aggiungi una
   breve nota se è utile, per esempio `/diagnostics bad tool choice`.
2. OpenClaw invia il preambolo della diagnostica e chiede un'approvazione exec
   esplicita. L'approvazione esegue `openclaw gateway diagnostics export --json`.
   Non approvare la diagnostica tramite una regola allow-all.
3. Dopo l'approvazione, OpenClaw risponde con un report incollabile contenente il
   percorso del bundle locale, il riepilogo del manifesto, note sulla privacy e gli ID di sessione pertinenti.

Nelle chat di gruppo, un proprietario può comunque eseguire `/diagnostics`, ma OpenClaw non
pubblica i dettagli diagnostici nella chat condivisa. Invia il preambolo,
le richieste di approvazione, il risultato dell'esportazione del Gateway e la suddivisione
di sessione/thread Codex al proprietario tramite il percorso di approvazione privato. Il gruppo riceve solo un breve avviso
che il flusso diagnostico è stato inviato privatamente. Se OpenClaw non riesce a trovare un percorso proprietario
privato, il comando fallisce in modo chiuso e chiede al proprietario di eseguirlo da un DM.

Quando la sessione OpenClaw attiva usa l'harness nativo OpenAI Codex,
la stessa approvazione exec copre anche un caricamento di feedback OpenAI per i thread
di runtime Codex di cui OpenClaw è a conoscenza. Quel caricamento è separato dallo zip locale
del Gateway e compare solo per le sessioni con harness Codex. Prima dell'approvazione, il
prompt spiega che approvare la diagnostica invierà anche feedback Codex, ma
non elenca gli ID di sessione o thread Codex. Dopo l'approvazione, la risposta in chat elenca
i canali, gli ID di sessione OpenClaw, gli ID di thread Codex e i comandi locali di ripresa
per i thread inviati ai server OpenAI. Se neghi o ignori
l'approvazione, OpenClaw non esegue l'esportazione, non invia feedback Codex e
non stampa gli ID Codex.

Questo rende breve il ciclo comune di debug di Codex: nota il comportamento errato in
Telegram, Discord o un altro canale, esegui `/diagnostics`, approva una volta, condividi
il report con il supporto, quindi esegui localmente il comando `codex resume <thread-id>` stampato
se vuoi ispezionare tu stesso il thread Codex nativo. Vedi
[harness Codex](/it/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) per
quel flusso di ispezione.

## Cosa contiene l'esportazione

Lo zip include:

- `summary.md`: panoramica leggibile da persone per il supporto.
- `diagnostics.json`: riepilogo leggibile da macchina di configurazione, log, stato, salute
  e dati di stabilità.
- `manifest.json`: metadati dell'esportazione ed elenco dei file.
- Struttura della configurazione sanitizzata e dettagli di configurazione non segreti.
- Riepiloghi dei log sanitizzati e righe di log recenti oscurate.
- Snapshot best-effort di stato e salute del Gateway.
- `stability/latest.json`: bundle di stabilità persistito più recente, quando disponibile.

L'esportazione è utile anche quando il Gateway non è sano. Se il Gateway non riesce a
rispondere alle richieste di stato o salute, i log locali, la struttura della configurazione e il bundle
di stabilità più recente vengono comunque raccolti quando disponibili.

## Modello di privacy

La diagnostica è progettata per essere condivisibile. L'esportazione conserva dati operativi
che aiutano il debug, come:

- nomi di sottosistemi, ID Plugin, ID provider, ID canale e modalità configurate
- codici di stato, durate, conteggi di byte, stato della coda e letture della memoria
- metadati dei log sanitizzati e messaggi operativi oscurati
- struttura della configurazione e impostazioni di funzionalità non segrete

L'esportazione omette o oscura:

- testo della chat, prompt, istruzioni, corpi webhook e output degli strumenti
- credenziali, chiavi API, token, cookie e valori segreti
- corpi grezzi di richieste o risposte
- ID account, ID messaggio, ID sessione grezzi, nomi host e nomi utente locali

Quando un messaggio di log assomiglia a testo di utente, chat, prompt o payload di strumento, l'
esportazione conserva solo il fatto che un messaggio è stato omesso e il conteggio dei byte.

## Registratore di stabilità

Il Gateway registra per impostazione predefinita un flusso di stabilità limitato e privo di payload quando
la diagnostica è abilitata. È destinato ai fatti operativi, non ai contenuti.

Lo stesso Heartbeat diagnostico registra campioni di liveness quando il Gateway continua a
funzionare ma il loop eventi Node.js o la CPU sembrano saturi. Questi eventi
`diagnostic.liveness.warning` includono ritardo del loop eventi, utilizzo del loop eventi,
rapporto dei core CPU e conteggi di sessioni attive/in attesa/in coda. I campioni inattivi
restano nella telemetria a livello `info`. I campioni di liveness diventano avvisi del Gateway
solo quando il lavoro è in attesa o in coda, oppure quando il lavoro attivo si sovrappone a
un ritardo sostenuto del loop eventi. I picchi transitori di ritardo massimo durante lavoro in background
altrimenti sano restano nei log di debug. Non riavviano il Gateway da soli.

Ispeziona il registratore live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Ispeziona il bundle di stabilità persistito più recente dopo un'uscita fatale, un timeout di arresto
o un errore di avvio al riavvio:

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
- `--log-lines <count>`: numero massimo di righe di log sanitizzate da includere.
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare.
- `--url <url>`: URL WebSocket del Gateway per snapshot di stato e salute.
- `--token <token>`: token del Gateway per snapshot di stato e salute.
- `--password <password>`: password del Gateway per snapshot di stato e salute.
- `--timeout <ms>`: timeout degli snapshot di stato e salute.
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa metadati dell'esportazione leggibili da macchina.

## Disabilitare la diagnostica

La diagnostica è abilitata per impostazione predefinita. Per disabilitare il registratore di stabilità e
la raccolta di eventi diagnostici:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Disabilitare la diagnostica riduce il dettaglio delle segnalazioni di bug. Non influisce sul normale
logging del Gateway.

## Correlati

- [Controlli di salute](/it/gateway/health)
- [CLI del Gateway](/it/cli/gateway#gateway-diagnostics-export)
- [Protocollo del Gateway](/it/gateway/protocol#system-and-identity)
- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — flusso separato per lo streaming della diagnostica a un collector
