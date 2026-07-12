---
read_when:
    - Executando ou depurando o processo do Gateway
    - Investigando a imposição de instância única
summary: 'Proteção de instância única do Gateway: bloqueio de arquivo e associação WebSocket/HTTP'
title: Bloqueio do Gateway
x-i18n:
    generated_at: "2026-07-12T15:12:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Por quê

- Apenas um processo do Gateway deve controlar uma determinada configuração + porta em um host; execute gateways adicionais com perfis isolados e portas exclusivas.
- Sobreviver a falhas/SIGKILL sem deixar arquivos de bloqueio obsoletos.
- Falhar rapidamente com um erro claro quando outro Gateway já controla a porta.

## Duas camadas

A inicialização impõe a propriedade de instância única em duas etapas independentes, nesta ordem:

1. **Bloqueio de arquivo** adquire um arquivo de bloqueio por configuração no diretório de bloqueios de estado. Como parte da aquisição, a inicialização verifica se há um listener ativo na porta configurada para detectar um proprietário de bloqueio obsoleto (que sofreu uma falha).
2. **Vinculação de socket** vincula o listener HTTP/WebSocket (padrão `ws://127.0.0.1:18789`) como um listener TCP exclusivo.

Cada camada pode falhar de forma independente e lança seu próprio `GatewayLockError`.

### Bloqueio de arquivo

- Se o arquivo de bloqueio estiver ausente, o processo proprietário registrado não existir mais ou a verificação da porta do proprietário não encontrar um listener ativo, a inicialização recupera o bloqueio e continua.
- Se o bloqueio estiver ativamente mantido e nenhuma das condições acima se aplicar, a inicialização tenta novamente por até 5 segundos (padrão) antes de desistir:

  ```text
  GatewayLockError("gateway já está em execução (pid <pid>); tempo limite do bloqueio após <ms>ms")
  ```

### Vinculação de socket

- Em caso de `EADDRINUSE`, a inicialização tenta novamente a vinculação por até 20 tentativas, em intervalos de 500ms (aproximadamente 10 segundos no total), para aguardar o término de uma janela `TIME_WAIT` após um processo encerrado recentemente.
- Se a porta ainda estiver em uso após as novas tentativas:

  ```text
  GatewayLockError("outra instância do gateway já está escutando em ws://127.0.0.1:<port>")
  ```

- Outras falhas de vinculação:

  ```text
  GatewayLockError("falha ao vincular o socket do gateway em ws://127.0.0.1:<port>: <cause>")
  ```

Durante o encerramento, o Gateway fecha o servidor HTTP/WebSocket e remove o arquivo de bloqueio.

## Notas operacionais

- Se a porta estiver ocupada por outro processo que não seja um Gateway, o erro será o mesmo; libere a porta ou escolha outra com `openclaw gateway --port <port>`.
- Sob um supervisor de serviços, um novo processo do Gateway que encontrar primeiro um dos erros acima verifica `/healthz` no processo existente. Se esse processo estiver íntegro, o novo processo o mantém no controle em vez de falhar. No systemd, ele é encerrado com o código `78`; a configuração `RestartPreventExitStatus=78` da unidade impede que `Restart=always` entre em loop devido a um conflito de bloqueio ou `EADDRINUSE`. Se o processo existente nunca ficar íntegro, as novas tentativas da verificação de integridade têm um limite de tempo e a inicialização falha com o erro de bloqueio acima, em vez de entrar em loop indefinidamente.
- O aplicativo para macOS mantém sua própria proteção leve por PID antes de iniciar o Gateway; o bloqueio de arquivo e a vinculação de socket descritos acima são os mecanismos efetivos de imposição em tempo de execução.

## Relacionado

- [Vários Gateways](/pt-BR/gateway/multiple-gateways) - execução de várias instâncias com portas exclusivas
- [Solução de problemas](/pt-BR/gateway/troubleshooting) - diagnóstico de `EADDRINUSE` e conflitos de porta
