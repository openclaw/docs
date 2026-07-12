---
read_when:
    - Explicação de como o direcionamento se comporta enquanto um agente usa ferramentas
    - Alteração do comportamento da fila de execuções ativas ou da integração de direcionamento em tempo de execução
    - Comparação do modo steering com os modos de fila followup, collect e interrupt
summary: Como o direcionamento de execuções ativas enfileira mensagens nos limites de runtime
title: Fila de direcionamento
x-i18n:
    generated_at: "2026-07-11T23:53:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando um prompt normal chega enquanto uma execução de sessão já está transmitindo e o modo da fila é `steer` (o padrão, sem necessidade de configuração), o OpenClaw tenta enviar esse prompt ao runtime ativo. O OpenClaw e o harness nativo do app-server do Codex implementam os detalhes da entrega de maneiras diferentes.

Esta página aborda o direcionamento pelo modo de fila para mensagens normais recebidas no modo `steer`. No modo `followup` ou `collect`, as mensagens normais ignoram esse caminho e aguardam até que a execução ativa termine. Para o comando explícito `/steer <message>`, consulte [Direcionar](/pt-BR/tools/steer).

## Limite do runtime

O direcionamento não interrompe uma chamada de ferramenta que já está em execução. O OpenClaw verifica se há mensagens de direcionamento na fila nos limites entre chamadas ao modelo:

1. O assistente solicita chamadas de ferramentas.
2. O OpenClaw executa o lote de chamadas de ferramentas da mensagem atual do assistente.
3. O OpenClaw emite o evento de término do turno.
4. O OpenClaw retira da fila as mensagens de direcionamento.
5. O OpenClaw acrescenta essas mensagens como mensagens do usuário antes da próxima chamada ao LLM.

Isso mantém os resultados das ferramentas associados à mensagem do assistente que os solicitou e permite que a próxima chamada ao modelo veja a entrada mais recente do usuário.

O harness nativo do app-server do Codex expõe `turn/steer` em vez da fila interna de direcionamento do runtime do OpenClaw. O OpenClaw agrupa os prompts enfileirados durante a janela de inatividade configurada e, em seguida, envia uma única solicitação `turn/steer` com todas as entradas de usuário coletadas na ordem de chegada.

Os turnos de revisão e de Compaction manual do Codex rejeitam o direcionamento no mesmo turno. Quando um runtime não consegue aceitar direcionamento no modo `steer`, o OpenClaw aguarda o término da execução ativa antes de iniciar o prompt.

## Modos

| Modo        | Comportamento durante a execução ativa                       | Comportamento posterior                                                                                   |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `steer`     | Direciona o prompt ao runtime ativo quando possível.         | Aguarda o término da execução ativa se o direcionamento não estiver disponível.                           |
| `followup`  | Não direciona.                                               | Executa as mensagens enfileiradas posteriormente, após o término da execução ativa.                       |
| `collect`   | Não direciona.                                               | Agrupa mensagens compatíveis da fila em um único turno posterior, após a janela de debounce.              |
| `interrupt` | Aborta a execução ativa em vez de direcionar o prompt a ela. | Inicia a mensagem mais recente após o aborto.                                                             |

## Exemplo de rajada

Se quatro usuários enviarem mensagens enquanto o agente estiver executando uma chamada de ferramenta:

- Com o comportamento padrão, o runtime ativo recebe as quatro mensagens na ordem de chegada antes de sua próxima decisão do modelo. O OpenClaw as retira da fila no próximo limite do modelo; o Codex as recebe como um único `turn/steer` em lote.
- Com `/queue collect`, o OpenClaw não direciona. Ele aguarda o término da execução ativa e, em seguida, cria um turno de acompanhamento com as mensagens compatíveis da fila após a janela de debounce.
- Com `/queue interrupt`, o OpenClaw aborta a execução ativa e inicia a mensagem mais recente em vez de direcioná-la.

## Escopo

O direcionamento sempre tem como destino a execução ativa atual da sessão. Ele não cria uma nova sessão, não altera a política de ferramentas da execução ativa nem separa mensagens por remetente. Em canais com vários usuários, os prompts recebidos já incluem o contexto do remetente e da rota, portanto a próxima chamada ao modelo pode identificar quem enviou cada mensagem.

Use `followup` ou `collect` quando quiser que as mensagens sejam enfileiradas por padrão, em vez de direcionadas à execução ativa. Use `interrupt` quando o prompt mais recente deva substituir a execução ativa.

## Debounce

`messages.queue.debounceMs` aplica-se à entrega enfileirada de `followup` e `collect`. No modo `steer` com o harness nativo do Codex, ele também define a janela de inatividade antes do envio de `turn/steer` em lote. No OpenClaw, o direcionamento ativo em si não usa o temporizador de debounce, pois o OpenClaw agrupa naturalmente as mensagens até o próximo limite do modelo.

## Conteúdo relacionado

- [Fila de comandos](/pt-BR/concepts/queue)
- [Direcionar](/pt-BR/tools/steer)
- [Mensagens](/pt-BR/concepts/messages)
- [Loop do agente](/pt-BR/concepts/agent-loop)
