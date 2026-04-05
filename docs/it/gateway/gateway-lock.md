---
read_when:
    - Stai eseguendo o facendo debug del processo gateway
    - Stai analizzando l'applicazione dell'istanza singola
summary: Protezione singleton del gateway tramite il bind del listener WebSocket
title: Blocco del gateway
x-i18n:
    generated_at: "2026-04-05T13:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Blocco del gateway

## Perché

- Garantire che venga eseguita una sola istanza gateway per porta base sullo stesso host; i gateway aggiuntivi devono usare profili isolati e porte univoche.
- Sopravvivere a crash/SIGKILL senza lasciare file di lock obsoleti.
- Fallire rapidamente con un errore chiaro quando la porta di controllo è già occupata.

## Meccanismo

- Il gateway esegue il bind del listener WebSocket (predefinito `ws://127.0.0.1:18789`) immediatamente all'avvio usando un listener TCP esclusivo.
- Se il bind fallisce con `EADDRINUSE`, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Il sistema operativo rilascia automaticamente il listener a ogni uscita del processo, inclusi crash e SIGKILL—non è necessario alcun file di lock separato o passaggio di pulizia.
- All'arresto il gateway chiude il server WebSocket e il server HTTP sottostante per liberare rapidamente la porta.

## Superficie degli errori

- Se un altro processo occupa la porta, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Gli altri errori di bind vengono esposti come `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Note operative

- Se la porta è occupata da _un altro_ processo, l'errore è lo stesso; libera la porta o scegline un'altra con `openclaw gateway --port <port>`.
- L'app macOS mantiene comunque il proprio leggero controllo PID prima di avviare il gateway; il lock runtime è imposto dal bind WebSocket.

## Correlati

- [Gateway multipli](/gateway/multiple-gateways) — esecuzione di più istanze con porte univoche
- [Risoluzione dei problemi](/gateway/troubleshooting) — diagnosi di `EADDRINUSE` e conflitti di porta
