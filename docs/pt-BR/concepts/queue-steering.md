---
read_when:
    - Explicando como o direcionamento se comporta enquanto um agente usa ferramentas
    - Alterando o comportamento da fila de execuções ativas ou a integração de direcionamento em tempo de execução
    - Comparando os modos steer, queue, collect e followup
summary: Como o direcionamento de execução ativa enfileira mensagens nos limites de tempo de execução
title: Fila de direcionamento
x-i18n:
    generated_at: "2026-04-30T09:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando uma mensagem chega enquanto uma execução de sessão já está transmitindo em streaming, o OpenClaw pode
enviar essa mensagem para o tempo de execução ativo em vez de iniciar outra execução para
a mesma sessão. Os modos públicos são neutros em relação ao tempo de execução; o Pi e o
arcabouço nativo app-server do Codex implementam os detalhes de entrega de formas diferentes.

## Limite do tempo de execução

A orientação não interrompe uma chamada de ferramenta que já está em execução. O Pi verifica
mensagens de orientação enfileiradas nos limites do modelo:

1. O assistente solicita chamadas de ferramenta.
2. O Pi executa o lote de chamadas de ferramenta da mensagem atual do assistente.
3. O Pi emite o evento de fim do turno.
4. O Pi drena as mensagens de orientação enfileiradas.
5. O Pi acrescenta essas mensagens como mensagens de usuário antes da próxima chamada ao LLM.

Isso mantém os resultados das ferramentas pareados com a mensagem do assistente que os solicitou,
e então permite que a próxima chamada ao modelo veja a entrada mais recente do usuário.

O arcabouço nativo app-server do Codex expõe `turn/steer` em vez da
fila interna de orientação do Pi. O OpenClaw adapta os mesmos modos nesse contexto:

- `steer` agrupa mensagens enfileiradas durante a janela de silêncio configurada e então envia uma
  única solicitação `turn/steer` com toda a entrada de usuário coletada na ordem de chegada.
- `queue` mantém o formato serializado legado enviando solicitações `turn/steer`
  separadas.
- `followup`, `collect`, `steer-backlog` e `interrupt` continuam sendo comportamento de
  fila do OpenClaw ao redor do turno ativo do Codex.

Turnos de revisão do Codex e de compactação manual rejeitam orientação no mesmo turno. Quando um
tempo de execução não pode aceitar orientação, o OpenClaw recorre à fila de acompanhamento quando
esse modo permite.

## Modos

| Modo            | Comportamento com execução ativa                                                                                             | Comportamento de acompanhamento posterior                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Injeta todas as mensagens de orientação enfileiradas juntas no próximo limite do tempo de execução. Este é o padrão.          | Recorre ao acompanhamento somente quando a orientação está indisponível.             |
| `queue`         | Orientação legada uma por vez. O Pi injeta uma mensagem enfileirada por limite do modelo; o Codex envia solicitações `turn/steer` separadas. | Recorre ao acompanhamento somente quando a orientação está indisponível.             |
| `steer-backlog` | Mesmo comportamento de orientação com execução ativa que `steer`.                                                            | Também mantém a mesma mensagem para um turno de acompanhamento posterior.            |
| `followup`      | Não orienta a execução atual.                                                                                                | Executa mensagens enfileiradas depois.                                              |
| `collect`       | Não orienta a execução atual.                                                                                                | Agrupa mensagens enfileiradas compatíveis em um turno posterior após a janela de debounce. |
| `interrupt`     | Aborta a execução ativa e então inicia a mensagem mais recente.                                                              | Nenhum.                                                                             |

## Exemplo de rajada

Se quatro usuários enviarem mensagens enquanto o agente está executando uma chamada de ferramenta:

- `steer`: o tempo de execução ativo recebe todas as quatro mensagens na ordem de chegada antes
  da próxima decisão do modelo. O Pi as drena no próximo limite do modelo; o Codex
  as recebe como um único `turn/steer` em lote.
- `queue`: orientação serializada legada. O Pi injeta uma mensagem enfileirada por vez;
  o Codex recebe solicitações `turn/steer` separadas.
- `collect`: o OpenClaw espera até a execução ativa terminar e então cria um turno de acompanhamento
  com mensagens enfileiradas compatíveis após a janela de debounce.

## Escopo

A orientação sempre mira a execução da sessão ativa atual. Ela não cria uma nova
sessão, não altera a política de ferramentas da execução ativa nem divide mensagens por remetente. Em
canais multiusuário, os prompts de entrada já incluem contexto de remetente e rota, para que
a próxima chamada ao modelo possa ver quem enviou cada mensagem.

Use `collect` quando quiser que o OpenClaw crie um turno de acompanhamento posterior que possa
agrupar mensagens compatíveis e preservar a política de descarte da fila de acompanhamento. Use
`queue` somente quando precisar do comportamento antigo de orientação uma por vez.

## Debounce

`messages.queue.debounceMs` se aplica à entrega de acompanhamento, incluindo `collect`,
`followup`, `steer-backlog` e fallback de `steer` quando a orientação com execução ativa não está
disponível. Para o Pi, o `steer` ativo em si não usa o temporizador de debounce porque
o Pi agrupa mensagens naturalmente até o próximo limite do modelo. Para o arcabouço nativo
do Codex, o OpenClaw usa o mesmo valor de debounce como janela de silêncio antes de
enviar o `turn/steer` em lote.

## Relacionados

- [Fila de comandos](/pt-BR/concepts/queue)
- [Mensagens](/pt-BR/concepts/messages)
- [Loop do agente](/pt-BR/concepts/agent-loop)
