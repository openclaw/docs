---
read_when:
    - Esecuzione o debug del processo Gateway
    - Analisi dell'applicazione dell'istanza singola
summary: Protezione singleton del Gateway tramite il bind del listener WebSocket
title: Blocco del Gateway
x-i18n:
    generated_at: "2026-04-24T08:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Perché

- Garantire che venga eseguita una sola istanza del gateway per porta base sullo stesso host; i gateway aggiuntivi devono usare profili isolati e porte univoche.
- Sopravvivere a crash/SIGKILL senza lasciare file di lock obsoleti.
- Fallire rapidamente con un errore chiaro quando la porta di controllo è già occupata.

## Meccanismo

- Il gateway esegue immediatamente il bind del listener WebSocket (predefinito `ws://127.0.0.1:18789`) all'avvio usando un listener TCP esclusivo.
- Se il bind fallisce con `EADDRINUSE`, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Il sistema operativo rilascia automaticamente il listener su qualsiasi uscita del processo, inclusi crash e SIGKILL — non è necessario alcun file di lock separato o passaggio di pulizia.
- All'arresto, il gateway chiude il server WebSocket e il server HTTP sottostante per liberare rapidamente la porta.

## Superficie di errore

- Se un altro processo occupa la porta, l'avvio genera `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Gli altri errori di bind emergono come `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Note operative

- Se la porta è occupata da _un altro_ processo, l'errore è lo stesso; libera la porta oppure scegli un'altra con `openclaw gateway --port <port>`.
- L'app macOS mantiene comunque il proprio leggero controllo PID prima di generare il gateway; il lock runtime viene applicato tramite il bind WebSocket.

## Correlati

- [Multiple Gateways](/it/gateway/multiple-gateways) — esecuzione di più istanze con porte univoche
- [Troubleshooting](/it/gateway/troubleshooting) — diagnosi di `EADDRINUSE` e conflitti di porta
