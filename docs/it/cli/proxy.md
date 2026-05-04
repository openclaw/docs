---
read_when:
    - È necessario convalidare il routing del proxy gestito dall’operatore prima della distribuzione
    - È necessario acquisire localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi ispezionare le sessioni del proxy di debug, i blob o i preset di query integrati
summary: Riferimento CLI per `openclaw proxy`, inclusa la convalida del proxy gestito dall'operatore e l'ispettore di acquisizione del proxy di debug locale
title: Proxy
x-i18n:
    generated_at: "2026-05-04T18:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Convalida l'instradamento proxy gestito dall'operatore oppure esegue il proxy di debug esplicito locale
e ispeziona il traffico acquisito.

Usa `validate` per eseguire il preflight di un proxy di inoltro gestito dall'operatore prima di abilitare
l'instradamento proxy di OpenClaw. Gli altri comandi sono strumenti di debug per
indagini a livello di trasporto: possono avviare un proxy locale, eseguire un comando figlio
con l'acquisizione abilitata, elencare le sessioni di acquisizione, interrogare pattern di traffico comuni, leggere
blob acquisiti ed eliminare i dati di acquisizione locali.

## Comandi

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Convalida

`openclaw proxy validate` controlla l'URL proxy effettivo gestito dall'operatore da
`--proxy-url`, dalla configurazione o da `OPENCLAW_PROXY_URL`. Segnala un problema di configurazione quando
nessun proxy è abilitato e configurato; usa `--proxy-url` per un preflight una tantum
prima di modificare la configurazione. Per impostazione predefinita verifica che una destinazione pubblica abbia esito positivo
attraverso il proxy e che il proxy non possa raggiungere un canary di loopback temporaneo.
Le destinazioni negate personalizzate sono fail-closed: le risposte HTTP e gli errori di trasporto
ambigui falliscono entrambi, a meno che tu possa verificare separatamente un segnale di negazione
specifico della distribuzione. Aggiungi `--apns-reachable` per aprire anche un tunnel
CONNECT HTTP/2 APNs attraverso il proxy e confermare che APNs sandbox risponda; il probe usa un
token provider intenzionalmente non valido, quindi una risposta APNs `403 InvalidProviderToken`
è un segnale di raggiungibilità riuscito.

Opzioni:

- `--json`: stampa JSON leggibile da macchina.
- `--proxy-url <url>`: convalida questo URL proxy invece della configurazione o dell'ambiente.
- `--allowed-url <url>`: aggiunge una destinazione che dovrebbe riuscire attraverso il proxy. Ripeti per controllare più destinazioni.
- `--denied-url <url>`: aggiunge una destinazione che dovrebbe essere bloccata dal proxy. Ripeti per controllare più destinazioni.
- `--apns-reachable`: verifica anche che APNs sandbox HTTP/2 sia raggiungibile attraverso il proxy.
- `--apns-authority <url>`: autorità APNs da sondare con `--apns-reachable` (`https://api.sandbox.push.apple.com` per impostazione predefinita; la produzione è `https://api.push.apple.com`).
- `--timeout-ms <ms>`: timeout per richiesta in millisecondi.

Consulta [Proxy di rete](/it/security/network-proxy) per indicazioni sulla distribuzione e semantica di negazione.

## Preset di query

`openclaw proxy query --preset <name>` accetta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Note

- `start` usa `127.0.0.1` per impostazione predefinita, a meno che `--host` sia impostato.
- `run` avvia un proxy di debug locale e poi esegue il comando dopo `--`.
- L'inoltro upstream diretto del proxy di debug apre socket upstream per la diagnostica. Quando la modalità proxy gestita di OpenClaw è attiva, l'inoltro diretto per le richieste proxy e i tunnel CONNECT è disabilitato per impostazione predefinita; imposta `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo per diagnostica locale approvata.
- `validate` esce con codice 1 quando la configurazione proxy o i controlli delle destinazioni falliscono.
- Le acquisizioni sono dati di debug locali; usa `openclaw proxy purge` quando hai finito.

## Correlati

- [Riferimento CLI](/it/cli)
- [Proxy di rete](/it/security/network-proxy)
- [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)
