---
read_when:
    - Executar ou depurar o processo do Gateway
    - Investigando a imposição de instância única
summary: Proteção singleton do Gateway usando o bind do listener WebSocket
title: Bloqueio do Gateway
x-i18n:
    generated_at: "2026-04-30T09:48:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por quê

- Garantir que apenas uma instância do Gateway seja executada por porta base no mesmo host; Gateways adicionais devem usar perfis isolados e portas exclusivas.
- Sobreviver a falhas/SIGKILL sem deixar arquivos de lock obsoletos.
- Falhar rapidamente com um erro claro quando a porta de controle já estiver ocupada.

## Mecanismo

- O Gateway primeiro adquire um arquivo de lock por configuração sob o diretório de locks de estado e verifica a porta configurada em busca de um processo em escuta existente.
- Se o proprietário registrado do lock não existir mais, a porta estiver livre ou o lock estiver obsoleto, a inicialização recupera o lock e continua.
- O Gateway então associa o ouvinte HTTP/WebSocket (padrão `ws://127.0.0.1:18789`) usando uma escuta TCP exclusiva.
- Se a associação falhar com `EADDRINUSE`, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- No encerramento, o Gateway fecha o servidor HTTP/WebSocket e remove o arquivo de lock.

## Superfície de erro

- Se outro processo estiver segurando a porta, a inicialização lança `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Outras falhas de associação aparecem como `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notas operacionais

- Se a porta estiver ocupada por _outro_ processo, o erro é o mesmo; libere a porta ou escolha outra com `openclaw gateway --port <port>`.
- Sob um supervisor de serviço, um novo processo do Gateway que encontra um respondedor `/healthz` saudável existente sai com sucesso e deixa esse processo no controle. Se o processo existente nunca ficar saudável, as novas tentativas são limitadas e a inicialização falha com um erro de lock claro, em vez de entrar em loop para sempre.
- O app macOS ainda mantém sua própria proteção leve por PID antes de iniciar o Gateway; o lock em tempo de execução é imposto pelo arquivo de lock mais a associação HTTP/WebSocket.

## Relacionado

- [Múltiplos Gateways](/pt-BR/gateway/multiple-gateways) — executando várias instâncias com portas exclusivas
- [Solução de problemas](/pt-BR/gateway/troubleshooting) — diagnosticando `EADDRINUSE` e conflitos de porta
