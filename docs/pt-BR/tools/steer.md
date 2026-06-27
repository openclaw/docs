---
read_when:
    - Usando /steer ou /tell enquanto um agente já está em execução
    - Comparando os modos /steer e /queue
    - Decidindo se deve orientar a execução atual ou uma sessão ACP
sidebarTitle: Steer
summary: Oriente uma execução ativa sem alterar o modo de fila
title: Conduzir
x-i18n:
    generated_at: "2026-06-27T18:18:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` primeiro tenta enviar orientação a uma execução já ativa. Ele serve para momentos de
"ajustar esta execução enquanto ela ainda está trabalhando". Se o runtime atual
não puder aceitar direcionamento, o OpenClaw envia a mensagem como um prompt normal em vez
de descartá-la.

## Sessão atual

Use `/steer` no nível superior para direcionar a execução ativa da sessão atual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamento:

- Direciona somente a execução ativa da sessão atual.
- Funciona independentemente do modo `/queue` da sessão.
- Inicia um turno normal com a mesma mensagem quando a sessão está ociosa ou a
  execução ativa não pode aceitar direcionamento.
- Usa o caminho de direcionamento do runtime ativo, então o modelo vê a orientação no
  próximo limite de runtime compatível.

## Direcionar vs enfileirar

`/queue steer` faz mensagens normais de entrada tentarem direcionar a execução ativa quando
elas chegam enquanto uma execução está ativa. `/steer <message>` é um comando explícito
que tenta injetar a mensagem desse comando na execução ativa no próximo
limite de runtime compatível, independentemente da configuração `/queue` armazenada. Quando
essa injeção não está disponível, o prefixo do comando é removido e `<message>`
continua como um prompt normal.

Use:

- `/steer <message>` quando quiser orientar a execução ativa agora.
- `/queue steer` quando quiser que mensagens normais futuras direcionem execuções ativas por
  padrão.
- `/queue collect` ou `/queue followup` quando mensagens normais futuras devem aguardar
  um turno posterior em vez de direcionar a execução ativa.
- `/queue interrupt` quando a mensagem mais recente deve substituir a execução ativa
  em vez de direcioná-la.

Para modos de fila e limites de direcionamento, consulte [Fila de comandos](/pt-BR/concepts/queue) e
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Subagentes

`/steer` no nível superior direciona a execução ativa da sessão atual. Subagentes informam
de volta à sessão pai/solicitante; `/subagents` serve apenas para visibilidade.

## Sessões ACP

Use `/acp steer` quando o alvo for uma sessão de harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para seleção de sessão ACP e comportamento de
runtime.

## Relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Fila de comandos](/pt-BR/concepts/queue)
- [Fila de direcionamento](/pt-BR/concepts/queue-steering)
- [Subagentes](/pt-BR/tools/subagents)
