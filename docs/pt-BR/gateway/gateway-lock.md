---
read_when:
    - Executar ou depurar o processo do gateway
    - Investigar imposição de instância única
summary: Proteção singleton do Gateway usando o bind do listener WebSocket
title: Bloqueio do Gateway
x-i18n:
    generated_at: "2026-04-24T05:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Por quê

- Garantir que apenas uma instância do gateway seja executada por porta base no mesmo host; gateways adicionais devem usar perfis isolados e portas exclusivas.
- Sobreviver a falhas/SIGKILL sem deixar arquivos de lock obsoletos.
- Falhar rapidamente com um erro claro quando a porta de controle já estiver ocupada.

## Mecanismo

- O gateway faz bind do listener WebSocket (padrão `ws://127.0.0.1:18789`) imediatamente na inicialização usando um listener TCP exclusivo.
- Se o bind falhar com `EADDRINUSE`, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- O SO libera o listener automaticamente em qualquer saída do processo, inclusive falhas e SIGKILL — não é necessário nenhum arquivo de lock separado nem etapa de limpeza.
- No desligamento, o gateway fecha o servidor WebSocket e o servidor HTTP subjacente para liberar a porta rapidamente.

## Superfície de erro

- Se outro processo estiver ocupando a porta, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Outras falhas de bind aparecem como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Observações operacionais

- Se a porta estiver ocupada por _outro_ processo, o erro é o mesmo; libere a porta ou escolha outra com `openclaw gateway --port <port>`.
- O app macOS ainda mantém sua própria proteção leve por PID antes de iniciar o gateway; o lock de runtime é imposto pelo bind do WebSocket.

## Relacionado

- [Múltiplos Gateways](/pt-BR/gateway/multiple-gateways) — executar várias instâncias com portas exclusivas
- [Solução de problemas](/pt-BR/gateway/troubleshooting) — diagnosticar `EADDRINUSE` e conflitos de porta
