---
read_when:
    - Como usar /steer ou /tell enquanto um agente já está em execução
    - Comparando `/steer` com os modos de `/queue`
    - Decidindo entre direcionar a execução atual ou uma sessão ACP
sidebarTitle: Steer
summary: Oriente uma execução ativa sem alterar o modo da fila
title: Orientar
x-i18n:
    generated_at: "2026-07-12T00:29:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` primeiro tenta enviar orientações para uma execução já ativa. Ele serve para
momentos em que você quer "ajustar esta execução enquanto ela ainda está em andamento". Se o runtime atual
não puder aceitar direcionamento, o OpenClaw enviará a mensagem como um prompt normal, em vez
de descartá-la.

## Sessão atual

Use `/steer` no nível superior para direcionar a execução ativa da sessão atual:

```text
/steer prefira o patch menor e mantenha os testes focados
/tell resuma antes de fazer a próxima chamada de ferramenta
```

Comportamento:

- Direciona apenas a execução ativa da sessão atual.
- Funciona independentemente do modo `/queue` da sessão.
- Inicia um turno normal com a mesma mensagem quando a sessão está ociosa ou quando a
  execução ativa não pode aceitar direcionamento.
- Usa o caminho de direcionamento do runtime ativo, portanto o modelo recebe a orientação no
  próximo limite de runtime compatível.

## Direcionamento versus fila

`/queue steer` faz com que mensagens de entrada normais tentem direcionar a execução ativa quando
chegam durante uma execução ativa. `/steer <message>` é um comando explícito
que tenta injetar a mensagem desse comando na execução ativa no próximo
limite de runtime compatível, independentemente da configuração `/queue` armazenada. Quando
essa injeção não está disponível, o prefixo do comando é removido e `<message>`
continua como um prompt normal.

Use:

- `/steer <message>` quando quiser orientar a execução ativa imediatamente.
- `/queue steer` quando quiser que futuras mensagens normais direcionem execuções ativas por
  padrão.
- `/queue collect` ou `/queue followup` quando futuras mensagens normais devem aguardar
  um turno posterior, em vez de direcionar a execução ativa.
- `/queue interrupt` quando a mensagem mais recente deve substituir a execução ativa,
  em vez de direcioná-la.

Para modos de fila e limites de direcionamento, consulte [Fila de comandos](/pt-BR/concepts/queue) e
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Subagentes

O `/steer` no nível superior direciona a execução ativa da sessão atual. Os subagentes enviam
seus relatórios de volta à sessão pai/solicitante; `/subagents` serve apenas para visibilidade.

## Sessões ACP

Use `/acp steer` quando o destino for uma sessão de harness ACP:

```text
/acp steer --session agent:main:acp:codex refine a reprodução
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para saber mais sobre a seleção de sessões ACP e o comportamento do
runtime.

## Relacionados

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Fila de comandos](/pt-BR/concepts/queue)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Subagentes](/pt-BR/tools/subagents)
