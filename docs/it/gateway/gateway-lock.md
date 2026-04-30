---
read_when:
    - Esecuzione o debug del processo Gateway
    - Analisi del vincolo di istanza singola
summary: Protezione singleton del Gateway tramite il bind del listener WebSocket
title: Blocco del Gateway
x-i18n:
    generated_at: "2026-04-30T08:51:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Perché

- Garantire che venga eseguita una sola istanza del Gateway per porta base sullo stesso host; i Gateway aggiuntivi devono usare profili isolati e porte univoche.
- Sopravvivere a crash/SIGKILL senza lasciare file di lock obsoleti.
- Fallire rapidamente con un errore chiaro quando la porta di controllo è già occupata.

## Meccanismo

- Il Gateway acquisisce prima un file di lock per configurazione nella directory dei lock di stato e verifica la porta configurata alla ricerca di un listener esistente.
- Se il proprietario del lock registrato non esiste più, la porta è libera o il lock è obsoleto, l'avvio rivendica il lock e continua.
- Il Gateway associa quindi il listener HTTP/WebSocket (predefinito `ws://127.0.0.1:18789`) usando un listener TCP esclusivo.
- Se il bind fallisce con `EADDRINUSE`, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- All'arresto, il Gateway chiude il server HTTP/WebSocket e rimuove il file di lock.

## Superficie degli errori

- Se un altro processo occupa la porta, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Gli altri errori di bind emergono come `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Note operative

- Se la porta è occupata da un _altro_ processo, l'errore è lo stesso; libera la porta o scegline un'altra con `openclaw gateway --port <port>`.
- Sotto un supervisore di servizio, un nuovo processo Gateway che rileva un responder `/healthz` esistente e integro termina correttamente e lascia quel processo in controllo. Se il processo esistente non diventa mai integro, i tentativi sono limitati e l'avvio fallisce con un chiaro errore di lock invece di ripetersi all'infinito.
- L'app macOS mantiene ancora la propria protezione PID leggera prima di avviare il Gateway; il lock di runtime è applicato dal file di lock più il bind HTTP/WebSocket.

## Correlati

- [Più Gateway](/it/gateway/multiple-gateways) — esecuzione di più istanze con porte univoche
- [Risoluzione dei problemi](/it/gateway/troubleshooting) — diagnosi di `EADDRINUSE` e dei conflitti di porta
