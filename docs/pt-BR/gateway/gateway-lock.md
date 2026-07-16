---
read_when:
    - Executar ou depurar o processo do Gateway
    - Investigando a imposição de instância única
summary: 'Proteção de instância única do Gateway: bloqueio de arquivo e vinculação WebSocket/HTTP'
title: Bloqueio do Gateway
x-i18n:
    generated_at: "2026-07-16T12:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por quê

- Apenas um processo do Gateway deve controlar um diretório de estado; execute Gateways adicionais com perfis, diretórios de estado, configurações e portas isolados.
- Resista a falhas/SIGKILL sem deixar arquivos de bloqueio obsoletos.
- Falhe rapidamente com um erro claro quando outro Gateway já controlar a porta.

## Três camadas

A inicialização impõe o controle em três etapas, nesta ordem:

1. O **bloqueio de controle do estado** adquire um bloqueio associado ao diretório de estado canônico. Todos os Gateways participam, inclusive os iniciados com `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, para que a manutenção destrutiva do SQLite não entre em conflito com um controlador ativo.
2. O **bloqueio de configuração** adquire o bloqueio histórico por configuração e registra a porta de runtime. O modo com vários Gateways ignora essa instância única de configuração, mas mantém o bloqueio de controle do estado.
3. A **vinculação do socket** vincula o listener HTTP/WebSocket (padrão `ws://127.0.0.1:18789`) como um listener TCP exclusivo.

Cada camada pode falhar de forma independente e lança seu próprio `GatewayLockError`.

### Bloqueios de estado e configuração

- A atividade do bloqueio é determinada pelo PID registrado, pela identidade de início do processo na plataforma, quando disponível, e pela identidade do processo do Gateway. Um controlador verificado permanece autoritativo durante a inicialização, antes que sua porta comece a escutar.
- Um coordenador SQLite dedicado serializa a inspeção de metadados, a recuperação de controladores obsoletos e a substituição de bloqueios. Sua transação exclusiva é liberada automaticamente se o processo controlador falhar.
- Se um arquivo de bloqueio estiver ausente ou o processo controlador registrado não estiver mais em execução, a inicialização recupera o bloqueio e continua.
- Se qualquer um dos bloqueios estiver ativamente mantido, a inicialização tenta novamente por até 5 segundos (padrão) antes de desistir:

  ```text
  GatewayLockError("gateway já está em execução (pid <pid>); tempo limite do bloqueio após <ms>ms")
  ```

### Vinculação do socket

- Em `EADDRINUSE`, a inicialização tenta novamente a vinculação por até 20 tentativas, em intervalos de 500ms (aproximadamente 10 segundos no total), para aguardar o fim de uma janela de `TIME_WAIT` após um processo encerrado recentemente.
- Se a porta ainda estiver em uso após as novas tentativas:

  ```text
  GatewayLockError("outra instância do gateway já está escutando em ws://127.0.0.1:<port>")
  ```

- Outras falhas de vinculação:

  ```text
  GatewayLockError("falha ao vincular o socket do gateway em ws://127.0.0.1:<port>: <cause>")
  ```

No encerramento, o Gateway fecha o servidor HTTP/WebSocket e remove seus arquivos
de bloqueio de estado e configuração.

## Observações operacionais

- Se a porta estiver ocupada por um processo diferente, que não seja um Gateway, o erro será o mesmo; libere a porta ou escolha outra com `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` permite várias instâncias de configuração/runtime, não o compartilhamento de estado mutável. Cada instância ainda precisa de um `OPENCLAW_STATE_DIR` exclusivo.
- Sob um supervisor de serviços, um novo processo do Gateway que encontra primeiro qualquer um dos erros acima verifica `/healthz` no processo existente. Se esse processo estiver íntegro, o novo processo o mantém no controle em vez de falhar. No systemd, ele é encerrado com o código `78`; o `RestartPreventExitStatus=78` da unidade impede que `Restart=always` entre em loop devido a um bloqueio ou conflito de `EADDRINUSE`. Se o processo existente nunca ficar íntegro, as novas tentativas de verificação de integridade têm duração limitada, e então a inicialização falha com o erro de bloqueio acima, em vez de entrar em loop indefinidamente.
- O aplicativo para macOS mantém sua própria proteção leve baseada em PID antes de iniciar o Gateway; o bloqueio de arquivo e a vinculação do socket descritos acima são os mecanismos reais de imposição em runtime.

## Relacionado

- [Vários Gateways](/pt-BR/gateway/multiple-gateways) - execução de várias instâncias com portas exclusivas
- [Solução de problemas](/pt-BR/gateway/troubleshooting) - diagnóstico de `EADDRINUSE` e conflitos de porta
