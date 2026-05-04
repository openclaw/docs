---
read_when:
    - Explicando como o direcionamento se comporta enquanto um agente usa ferramentas
    - Alterar o comportamento da fila de execução ativa ou a integração de direcionamento em tempo de execução
    - Comparando os modos steer, queue, collect e followup
summary: Como o direcionamento de execução ativa enfileira mensagens nos limites de tempo de execução
title: Fila de direcionamento
x-i18n:
    generated_at: "2026-05-04T02:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando uma mensagem chega enquanto uma execução de sessão já está transmitindo, o OpenClaw pode
enviar essa mensagem para o ambiente de execução ativo em vez de iniciar outra execução para
a mesma sessão. Os modos públicos são neutros em relação ao ambiente de execução; Pi e o harness
nativo de servidor de aplicativo do Codex implementam os detalhes de entrega de formas diferentes.

## Limite do ambiente de execução

O direcionamento não interrompe uma chamada de ferramenta que já está em execução. Pi verifica
mensagens de direcionamento enfileiradas nos limites do modelo:

1. O assistente solicita chamadas de ferramentas.
2. Pi executa o lote de chamadas de ferramentas da mensagem atual do assistente.
3. Pi emite o evento de fim do turno.
4. Pi drena as mensagens de direcionamento enfileiradas.
5. Pi acrescenta essas mensagens como mensagens de usuário antes da próxima chamada ao LLM.

Isso mantém os resultados das ferramentas pareados com a mensagem do assistente que os solicitou,
e então permite que a próxima chamada do modelo veja a entrada mais recente do usuário.

O harness nativo de servidor de aplicativo do Codex expõe `turn/steer` em vez da
fila interna de direcionamento do Pi. O OpenClaw adapta os mesmos modos ali:

- `steer` agrupa mensagens enfileiradas durante a janela de silêncio configurada e então envia uma
  única solicitação `turn/steer` com todas as entradas de usuário coletadas na ordem de chegada.
- `queue` mantém o formato serializado legado enviando solicitações `turn/steer`
  separadas.
- `followup`, `collect`, `steer-backlog` e `interrupt` permanecem como comportamento de fila
  pertencente ao OpenClaw em torno do turno ativo do Codex.

Turnos de revisão do Codex e de Compaction manual rejeitam direcionamento no mesmo turno. Quando um
ambiente de execução não consegue aceitar direcionamento, o OpenClaw recorre à fila de acompanhamento quando
esse modo permite.

Esta página explica o direcionamento em modo de fila para mensagens de entrada normais. Para o
comando explícito `/steer <message>`, consulte [Direcionar](/tools/steer).

## Modos

| Modo            | Comportamento com execução ativa                                                                                                          | Comportamento de acompanhamento posterior                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Injeta todas as mensagens de direcionamento enfileiradas juntas no próximo limite do ambiente de execução. Este é o padrão.                             | Recorre ao acompanhamento somente quando o direcionamento está indisponível.                           |
| `queue`         | Direcionamento legado uma por vez. Pi injeta uma mensagem enfileirada por limite de modelo; Codex envia solicitações `turn/steer` separadas. | Recorre ao acompanhamento somente quando o direcionamento está indisponível.                           |
| `steer-backlog` | Mesmo comportamento de direcionamento com execução ativa que `steer`.                                                                                | Também mantém a mesma mensagem para um turno de acompanhamento posterior.                              |
| `followup`      | Não direciona a execução atual.                                                                                              | Executa mensagens enfileiradas depois.                                                         |
| `collect`       | Não direciona a execução atual.                                                                                              | Agrupa mensagens enfileiradas compatíveis em um turno posterior após a janela de debounce. |
| `interrupt`     | Aborta a execução ativa e então inicia a mensagem mais recente.                                                                       | Nenhum.                                                                               |

## Exemplo de rajada

Se quatro usuários enviarem mensagens enquanto o agente está executando uma chamada de ferramenta:

- `steer`: o ambiente de execução ativo recebe todas as quatro mensagens na ordem de chegada antes
  de sua próxima decisão do modelo. Pi as drena no próximo limite do modelo; Codex
  as recebe como um `turn/steer` agrupado.
- `queue`: direcionamento serializado legado. Pi injeta uma mensagem enfileirada por vez;
  Codex recebe solicitações `turn/steer` separadas.
- `collect`: o OpenClaw espera até que a execução ativa termine e então cria um turno de acompanhamento
  com mensagens enfileiradas compatíveis após a janela de debounce.

## Escopo

O direcionamento sempre mira a execução de sessão ativa atual. Ele não cria uma nova
sessão, não altera a política de ferramentas da execução ativa nem divide mensagens por remetente. Em
canais multiusuário, os prompts de entrada já incluem contexto de remetente e rota, então
a próxima chamada do modelo consegue ver quem enviou cada mensagem.

Use `collect` quando quiser que o OpenClaw crie um turno de acompanhamento posterior que possa
agrupar mensagens compatíveis e preservar a política de descarte da fila de acompanhamento. Use
`queue` somente quando precisar do comportamento de direcionamento antigo uma por vez.

## Debounce

`messages.queue.debounceMs` se aplica à entrega de acompanhamento, incluindo `collect`,
`followup`, `steer-backlog` e fallback de `steer` quando o direcionamento com execução ativa não está
disponível. Para Pi, o próprio `steer` ativo não usa o temporizador de debounce porque
Pi naturalmente agrupa mensagens até o próximo limite do modelo. Para o harness nativo do
Codex, o OpenClaw usa o mesmo valor de debounce como a janela de silêncio antes de
enviar o `turn/steer` agrupado.

## Relacionados

- [Fila de comandos](/pt-BR/concepts/queue)
- [Direcionar](/tools/steer)
- [Mensagens](/pt-BR/concepts/messages)
- [Loop do agente](/pt-BR/concepts/agent-loop)
