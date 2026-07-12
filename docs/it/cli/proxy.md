---
read_when:
    - Devi convalidare l'instradamento del proxy gestito dall'operatore prima della distribuzione
    - Devi acquisire localmente il traffico di trasporto di OpenClaw per il debug
    - Vuoi esaminare le sessioni del proxy di debug, i blob o i preset di query integrati
summary: Riferimento della CLI per `openclaw proxy`, inclusi la convalida del proxy gestito dall'operatore e lo strumento locale di ispezione delle acquisizioni del proxy di debug
title: Proxy
x-i18n:
    generated_at: "2026-07-12T06:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Convalida l'instradamento del proxy gestito dall'operatore oppure esegue il proxy di debug esplicito locale e ispeziona il traffico acquisito.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` esegue una verifica preliminare di un proxy di inoltro gestito dall'operatore. Gli altri sono strumenti di debug per l'analisi a livello di trasporto: avviano un proxy locale con acquisizione, eseguono un comando figlio tramite esso, elencano le sessioni di acquisizione, interrogano gli schemi del traffico, leggono i blob acquisiti ed eliminano i dati di acquisizione locali.

## Convalida

Verifica l'URL effettivo del proxy gestito dall'operatore, ricavato da `--proxy-url`, dalla configurazione (`proxy.proxyUrl`) o da `OPENCLAW_PROXY_URL`, in questo ordine di precedenza. Segnala un problema di configurazione se nessun proxy è abilitato e configurato; passa `--proxy-url` per una verifica preliminare una tantum senza modificare la configurazione.

Gli URL dei proxy gestiti usano `http://` per un listener proxy di inoltro non cifrato oppure `https://` quando OpenClaw deve aprire una connessione TLS verso l'endpoint proxy stesso prima di inviare le richieste proxy. Usa `--proxy-ca-file` per considerare attendibile una CA privata per tale connessione TLS.

Per impostazione predefinita esegue:

- un controllo **consentito** verso `https://example.com/` (sostituibile o integrabile con `--allowed-url`, ripetibile)
- un controllo **negato** verso un canary temporaneo sull'interfaccia di loopback (sostituibile con `--denied-url`, ripetibile)

Le destinazioni personalizzate di `--denied-url` adottano un comportamento fail-closed: sia le risposte HTTP sia gli errori di trasporto ambigui vengono considerati errori, a meno che non sia possibile verificare in modo indipendente un segnale di negazione specifico della distribuzione. Il canary di loopback integrato è l'unica destinazione per cui un errore di trasporto viene considerato una prova del blocco.

Aggiungi `--apns-reachable` per aprire anche un tunnel CONNECT HTTP/2 di APNs attraverso il proxy e confermare che l'ambiente sandbox di APNs risponda. Il test invia intenzionalmente un token del provider non valido, pertanto una risposta APNs `403 InvalidProviderToken` viene considerata un segnale positivo di raggiungibilità, non un errore.

### Opzioni

| Flag                     | Effetto                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | stampa JSON leggibile dalla macchina                                                                                           |
| `--proxy-url <url>`      | convalida questo URL proxy `http://`/`https://` invece della configurazione o della variabile di ambiente                       |
| `--proxy-ca-file <path>` | considera attendibile questo file CA PEM per la verifica TLS di un endpoint proxy HTTPS                                        |
| `--allowed-url <url>`    | destinazione che dovrebbe essere raggiunta correttamente attraverso il proxy (ripetibile)                                      |
| `--denied-url <url>`     | destinazione che dovrebbe essere bloccata dal proxy (ripetibile)                                                               |
| `--apns-reachable`       | verifica anche che APNs HTTP/2 nell'ambiente sandbox sia raggiungibile attraverso il proxy                                     |
| `--apns-authority <url>` | autorità APNs da verificare (valore predefinito: `https://api.sandbox.push.apple.com`; produzione: `https://api.push.apple.com`) |
| `--timeout-ms <ms>`      | timeout per richiesta                                                                                                          |

Termina con il codice 1 quando la configurazione del proxy o i controlli delle destinazioni non riescono.

Consulta [Proxy di rete](/it/security/network-proxy) per indicazioni sulla distribuzione e sulla semantica della negazione.

## Proxy di debug

`start` avvia un proxy locale con acquisizione e ne stampa l'URL, il percorso del certificato CA e il percorso del database delle acquisizioni; interrompilo con Ctrl+C. Per impostazione predefinita si associa a `127.0.0.1`, a meno che non sia impostato `--host`.

`run` avvia un proxy di debug locale, quindi esegue `<cmd...>` (dopo `--`) con le variabili di ambiente del proxy applicate, nella propria sessione di acquisizione.

L'inoltro diretto verso upstream del proxy di debug apre socket upstream a scopo diagnostico. Quando è attiva la modalità proxy gestito di OpenClaw, l'inoltro diretto delle richieste proxy e dei tunnel CONNECT è disabilitato per impostazione predefinita; imposta `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` solo per attività diagnostiche locali approvate.

`coverage` stampa un rapporto JSON (`summary` e `entries` per ciascun trasporto) che indica quali trasporti vengono acquisiti, quali funzionano solo tramite proxy e quali non sono coperti.

`sessions` elenca le sessioni di acquisizione recenti (`--limit`, valore predefinito: 20).

`query --preset <name>` esegue una query integrata sul traffico acquisito, facoltativamente limitata a `--session <id>`. Preimpostazioni:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` stampa il contenuto non elaborato di un blob di payload acquisito.

`purge` elimina tutti i metadati e i blob del traffico acquisito. Le acquisizioni sono dati di debug locali; eliminale al termine.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Proxy di rete](/it/security/network-proxy)
- [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)
