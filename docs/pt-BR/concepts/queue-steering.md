---
read_when:
    - Explicando como o steer se comporta enquanto um agente está usando ferramentas
    - Alteração do comportamento da fila de execuções ativas ou da integração de direcionamento em tempo de execução
    - Comparando o direcionamento com os modos de fila followup, collect e interrupt
summary: Como o direcionamento de execução ativa enfileira mensagens nos limites de runtime
title: Fila de direcionamento
x-i18n:
    generated_at: "2026-06-27T17:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando um prompt normal chega enquanto uma execução de sessão já está transmitindo, o OpenClaw
tenta enviar esse prompt para o runtime ativo por padrão quando o modo de fila
é `steer`. Nenhuma entrada de configuração nem diretiva de fila é necessária para esse comportamento
padrão. O OpenClaw e o harness nativo do servidor de apps do Codex implementam os detalhes
de entrega de maneiras diferentes.

## Limite do runtime

O direcionamento não interrompe uma chamada de ferramenta que já está em execução. O OpenClaw verifica
mensagens de direcionamento na fila nos limites do modelo:

1. O assistente solicita chamadas de ferramenta.
2. O OpenClaw executa o lote de chamadas de ferramenta da mensagem atual do assistente.
3. O OpenClaw emite o evento de fim do turno.
4. O OpenClaw drena as mensagens de direcionamento na fila.
5. O OpenClaw anexa essas mensagens como mensagens de usuário antes da próxima chamada ao LLM.

Isso mantém os resultados das ferramentas pareados com a mensagem do assistente que os solicitou
e, em seguida, permite que a próxima chamada ao modelo veja a entrada mais recente do usuário.

O harness nativo do servidor de apps do Codex expõe `turn/steer` em vez da fila de direcionamento
interna do runtime do OpenClaw. O OpenClaw agrupa prompts na fila durante a janela de silêncio
configurada e, em seguida, envia uma única solicitação `turn/steer` com toda a entrada de usuário
coletada na ordem de chegada.

Turnos de revisão do Codex e de Compaction manual rejeitam direcionamento no mesmo turno. Quando um
runtime não consegue aceitar direcionamento no modo `steer`, o OpenClaw espera a execução ativa
terminar antes de iniciar o prompt.

Esta página explica o direcionamento por modo de fila para mensagens de entrada normais quando o modo
é `steer`. Se o modo for `followup` ou `collect`, mensagens normais não entram
nesse caminho de direcionamento; elas aguardam até que a execução ativa termine. Para o comando explícito
`/steer <message>`, consulte [Direcionar](/pt-BR/tools/steer).

## Modos

| Modo        | Comportamento na execução ativa                         | Comportamento posterior                                                           |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `steer`     | Direciona o prompt para o runtime ativo quando possível. | Aguarda a execução ativa terminar se o direcionamento estiver indisponível.       |
| `followup`  | Não direciona.                                           | Executa mensagens na fila depois, após o fim da execução ativa.                   |
| `collect`   | Não direciona.                                           | Agrupa mensagens compatíveis na fila em um turno posterior após a janela de debounce. |
| `interrupt` | Aborta a execução ativa em vez de direcioná-la.          | Inicia a mensagem mais recente após abortar.                                      |

## Exemplo de burst

Se quatro usuários enviarem mensagens enquanto o agente está executando uma chamada de ferramenta:

- Com o comportamento padrão, o runtime ativo recebe todas as quatro mensagens na
  ordem de chegada antes da próxima decisão do modelo. O OpenClaw as drena no próximo limite do modelo;
  o Codex as recebe como um único `turn/steer` agrupado.
- Com `/queue collect`, o OpenClaw não direciona. Ele aguarda até que a execução ativa
  termine e, em seguida, cria um turno de acompanhamento com mensagens compatíveis na fila após a
  janela de debounce.
- Com `/queue interrupt`, o OpenClaw aborta a execução ativa e inicia a mensagem mais recente
  em vez de direcionar.

## Escopo

O direcionamento sempre aponta para a execução de sessão ativa atual. Ele não cria uma nova
sessão, não altera a política de ferramentas da execução ativa nem divide mensagens por remetente. Em
canais multiusuário, prompts de entrada já incluem contexto de remetente e rota, portanto
a próxima chamada ao modelo consegue ver quem enviou cada mensagem.

Use `followup` ou `collect` quando quiser que as mensagens entrem na fila por padrão em vez
de direcionar a execução ativa. Use `interrupt` quando o prompt mais recente deve
substituir a execução ativa.

## Debounce

`messages.queue.debounceMs` se aplica à entrega de `followup` e `collect` na fila.
No modo `steer` com o harness nativo do Codex, ele também define a janela de silêncio
antes de enviar `turn/steer` agrupado. Para o OpenClaw, o direcionamento ativo em si não usa
o temporizador de debounce porque o OpenClaw agrupa mensagens naturalmente até o próximo limite do modelo.

## Relacionados

- [Fila de comandos](/pt-BR/concepts/queue)
- [Direcionar](/pt-BR/tools/steer)
- [Mensagens](/pt-BR/concepts/messages)
- [Loop do agente](/pt-BR/concepts/agent-loop)
