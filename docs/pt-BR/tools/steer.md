---
read_when:
    - Usando /steer ou /tell enquanto um agente já está em execução
    - Comparando /steer com /queue steer
    - Decidindo se deve orientar a execução atual, um subagente ou uma sessão ACP
sidebarTitle: Steer
summary: Oriente uma execução ativa sem alterar o modo de fila
title: Direcionar
x-i18n:
    generated_at: "2026-05-04T05:55:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` envia orientação para uma execução já ativa. Ele é para momentos de "ajustar esta
execução enquanto ela ainda está trabalhando", não para iniciar um novo turno.

## Sessão atual

Use `/steer` de nível superior para direcionar a execução ativa da sessão atual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamento:

- Direciona somente a execução ativa da sessão atual.
- Funciona independentemente do modo `/queue` da sessão.
- Não inicia uma nova execução quando a sessão está ociosa.
- Responde com um aviso quando não há execução ativa para direcionar.
- Usa o caminho de direcionamento do runtime ativo, portanto o modelo vê a orientação no
  próximo limite de runtime compatível.

## Direcionar vs fila

`/queue steer` altera como mensagens de entrada normais se comportam quando chegam
enquanto uma execução está ativa. `/steer <message>` é um comando explícito que tenta
injetar a mensagem desse comando na execução ativa no próximo limite de runtime
compatível, independentemente da configuração `/queue` armazenada.

Use:

- `/steer <message>` quando quiser orientar a execução ativa agora.
- `/queue steer` quando quiser que futuras mensagens normais direcionem execuções ativas por
  padrão.
- `/queue collect` ou `/queue followup` quando novas mensagens devem aguardar um
  turno posterior em vez de direcionar a execução ativa.

Para modos de fila e comportamento de fallback, consulte [Fila de comandos](/pt-BR/concepts/queue) e
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Subagentes

Use `/subagents steer` quando o alvo for uma execução filha:

```text
/subagents steer 2 focus only on the API surface
```

`/steer` de nível superior não seleciona um subagente por id ou índice de lista. Ele sempre
direciona a execução ativa da sessão atual. Consulte [Subagentes](/pt-BR/tools/subagents) para
ids, rótulos e comandos de controle de subagentes.

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
