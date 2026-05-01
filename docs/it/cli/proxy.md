---
read_when:
    - È necessario convalidare l'instradamento del proxy gestito dall'operatore prima della distribuzione
    - È necessario acquisire localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi ispezionare le sessioni del proxy di debug, gli oggetti binari o le preimpostazioni di query integrate
summary: Riferimento CLI per `openclaw proxy`, inclusa la validazione del proxy gestito dall'operatore e l'ispettore delle acquisizioni del proxy di debug locale
title: Proxy
x-i18n:
    generated_at: "2026-05-01T08:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Convalida l'instradamento proxy gestito dall'operatore oppure esegue il proxy di debug esplicito locale
e ispeziona il traffico acquisito.

Usa `validate` per controllare in anticipo un forward proxy gestito dall'operatore prima di abilitare
l'instradamento proxy di OpenClaw. Gli altri comandi sono strumenti di debug per
indagini a livello di trasporto: possono avviare un proxy locale, eseguire un comando figlio
con l'acquisizione abilitata, elencare le sessioni di acquisizione, interrogare pattern di traffico comuni, leggere
i blob acquisiti ed eliminare i dati di acquisizione locali.

## Comandi

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Convalida

`openclaw proxy validate` controlla l'URL effettivo del proxy gestito dall'operatore da
`--proxy-url`, dalla configurazione o da `OPENCLAW_PROXY_URL`. Segnala un problema di configurazione quando
nessun proxy è abilitato e configurato; usa `--proxy-url` per un controllo preliminare una tantum
prima di modificare la configurazione. Per impostazione predefinita, verifica che una destinazione pubblica riesca
attraverso il proxy e che il proxy non possa raggiungere un canary loopback temporaneo.
Le destinazioni negate personalizzate sono fail-closed: le risposte HTTP e gli errori di trasporto
ambigui falliscono entrambi, a meno che tu non possa verificare separatamente un segnale di negazione
specifico della distribuzione.

Opzioni:

- `--json`: stampa JSON leggibile dalla macchina.
- `--proxy-url <url>`: convalida questo URL proxy invece della configurazione o dell'ambiente.
- `--allowed-url <url>`: aggiunge una destinazione che dovrebbe riuscire attraverso il proxy. Ripeti per controllare più destinazioni.
- `--denied-url <url>`: aggiunge una destinazione che dovrebbe essere bloccata dal proxy. Ripeti per controllare più destinazioni.
- `--timeout-ms <ms>`: timeout per richiesta in millisecondi.

Vedi [Proxy di rete](/it/security/network-proxy) per indicazioni sulla distribuzione e sulla semantica
di negazione.

## Preset di query

`openclaw proxy query --preset <name>` accetta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Note

- `start` usa per impostazione predefinita `127.0.0.1`, salvo che `--host` sia impostato.
- `run` avvia un proxy di debug locale e poi esegue il comando dopo `--`.
- `validate` termina con codice 1 quando la configurazione del proxy o i controlli delle destinazioni falliscono.
- Le acquisizioni sono dati di debug locali; usa `openclaw proxy purge` quando hai finito.

## Correlati

- [Riferimento CLI](/it/cli)
- [Proxy di rete](/it/security/network-proxy)
- [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)
