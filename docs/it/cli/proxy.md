---
read_when:
    - Devi convalidare il routing del proxy gestito dall'operatore prima del deployment
    - Devi acquisire localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi ispezionare sessioni del proxy di debug, blob o preset di query integrati
summary: Riferimento CLI per `openclaw proxy`, inclusa la convalida del proxy gestito dall'operatore e l'ispettore di acquisizione del proxy di debug locale
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:21:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Convalida l'instradamento proxy gestito dall'operatore oppure esegue il proxy
di debug esplicito locale e ispeziona il traffico acquisito.

Usa `validate` per eseguire il preflight di un proxy forward gestito
dall'operatore prima di abilitare l'instradamento proxy di OpenClaw. Gli altri
comandi sono strumenti di debug per l'indagine a livello di trasporto: possono
avviare un proxy locale, eseguire un comando figlio con l'acquisizione abilitata,
elencare le sessioni di acquisizione, interrogare pattern di traffico comuni,
leggere blob acquisiti ed eliminare i dati di acquisizione locali.

## Comandi

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Convalida

`openclaw proxy validate` controlla l'URL proxy effettivo gestito dall'operatore da
`--proxy-url`, dalla configurazione o da `OPENCLAW_PROXY_URL`. Gli URL dei proxy
gestiti possono usare `http://` per un listener proxy forward in chiaro oppure
`https://` quando OpenClaw deve aprire TLS verso l'endpoint proxy prima di
inviare richieste proxy. Segnala un problema di configurazione quando nessun
proxy è abilitato e configurato; usa `--proxy-url` per un preflight una tantum
prima di modificare la configurazione. Aggiungi `--proxy-ca-file` per considerare
attendibile una CA privata per la connessione TLS a un endpoint proxy HTTPS. Per
impostazione predefinita verifica che una destinazione pubblica abbia successo
attraverso il proxy e che il proxy non possa raggiungere un canary di loopback
temporaneo. Le destinazioni negate personalizzate sono fail-closed: sia le
risposte HTTP sia gli errori di trasporto ambigui falliscono, a meno che tu non
possa verificare separatamente un segnale di negazione specifico della
distribuzione. Aggiungi `--apns-reachable` per aprire anche un tunnel CONNECT
HTTP/2 APNs attraverso il proxy e confermare che l'ambiente sandbox APNs
risponda; la sonda usa intenzionalmente un token provider non valido, quindi una
risposta APNs `403 InvalidProviderToken` è un segnale di raggiungibilità riuscito.

Opzioni:

- `--json`: stampa JSON leggibile dalla macchina.
- `--proxy-url <url>`: convalida questo URL proxy `http://` o `https://` invece della configurazione o dell'ambiente.
- `--proxy-ca-file <path>`: considera attendibile questo file CA PEM per la verifica TLS di un endpoint proxy HTTPS.
- `--allowed-url <url>`: aggiunge una destinazione che ci si aspetta abbia successo attraverso il proxy. Ripeti per controllare più destinazioni.
- `--denied-url <url>`: aggiunge una destinazione che ci si aspetta venga bloccata dal proxy. Ripeti per controllare più destinazioni.
- `--apns-reachable`: verifica anche che APNs HTTP/2 sandbox sia raggiungibile attraverso il proxy.
- `--apns-authority <url>`: authority APNs da sondare con `--apns-reachable` (`https://api.sandbox.push.apple.com` per impostazione predefinita; produzione: `https://api.push.apple.com`).
- `--timeout-ms <ms>`: timeout per richiesta in millisecondi.

Vedi [Proxy di rete](/it/security/network-proxy) per indicazioni sulla distribuzione
e sulla semantica della negazione.

## Preset di query

`openclaw proxy query --preset <name>` accetta:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Note

- `start` usa `127.0.0.1` come impostazione predefinita, a meno che `--host` non sia impostato.
- `run` avvia un proxy di debug locale e poi esegue il comando dopo `--`.
- L'inoltro diretto verso l'upstream del proxy di debug apre socket upstream per la diagnostica. Quando la modalità proxy gestita di OpenClaw è attiva, l'inoltro diretto per le richieste proxy e i tunnel CONNECT è disabilitato per impostazione predefinita; imposta `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo per diagnostica locale approvata.
- `validate` termina con codice 1 quando la configurazione proxy o i controlli delle destinazioni falliscono.
- Le acquisizioni sono dati di debug locali; usa `openclaw proxy purge` al termine.

## Correlati

- [Riferimento CLI](/it/cli)
- [Proxy di rete](/it/security/network-proxy)
- [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)
