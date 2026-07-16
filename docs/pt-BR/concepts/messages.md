---
read_when:
    - Explicação de como as mensagens recebidas se tornam respostas
    - Esclarecimento sobre sessões, modos de enfileiramento ou comportamento de streaming
    - Documentação da visibilidade do raciocínio e das implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-07-16T12:24:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

As mensagens de entrada passam por roteamento, desduplicação/debounce, uma execução do agente e entrega de saída:

```text
Mensagem de entrada
  -> roteamento/vínculos -> chave de sessão
  -> desduplicação + debounce
  -> fila (se uma execução já estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas de saída (limites do canal + fragmentação)
```

Principais superfícies de configuração:

- `messages.*` para prefixos, enfileiramento, debounce de entrada e comportamento de grupos.
- `agents.defaults.*` para streaming em blocos, fragmentação e padrões de resposta silenciosa.
- Substituições de canal (`channels.telegram.*`, `channels.whatsapp.*` etc.) para limites e opções de streaming por canal.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Desduplicação de entrada

Os canais podem entregar novamente a mesma mensagem após uma reconexão. O OpenClaw mantém um cache em memória indexado pelo escopo do agente, pela rota do canal (canal + par + conta + thread) e pelo ID da mensagem, para que uma mensagem entregue novamente não acione uma segunda execução do agente. A entrada do cache expira após 20 minutos ou quando 5000 entradas são rastreadas, o que ocorrer primeiro.

## Debounce de entrada

Mensagens de texto consecutivas e rápidas do mesmo remetente podem ser agrupadas em um turno do agente por meio de `messages.inbound`. O debounce tem escopo por canal + conversa e usa a mensagem mais recente para o encadeamento/IDs da resposta.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- O debounce se aplica somente a mensagens de texto; mídias/anexos provocam o envio imediato.
- Comandos de controle (parar/abortar/status etc.) ignoram o debounce para serem despachados imediatamente.
- Desativado por padrão: `messages.inbound.debounceMs` não tem um valor padrão integrado, portanto o debounce só é ativado depois de ser definido (globalmente ou por canal).
- A ativação opcional de `coalesceSameSenderDms` do iMessage é a única exceção: ela retém por tempo suficiente todo texto de mensagem direta do mesmo remetente (incluindo comandos) para que o envio separado de comando+URL da Apple chegue como um único turno. Os chats em grupo sempre são despachados instantaneamente, independentemente dessa configuração.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Os chats diretos são consolidados na chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem ser mapeados para a mesma sessão, mas o histórico não é totalmente sincronizado de volta com todos os clientes. Use um único dispositivo principal para conversas longas a fim de evitar contextos divergentes. A interface de controle e a TUI sempre mostram a transcrição da sessão mantida pelo Gateway, portanto são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Corpos de prompt e contexto do histórico

Os Plugins de canal preenchem vários campos de texto no contexto de entrada, do mais ao menos preferencial:

| Campo             | Finalidade                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto voltado ao modelo para o turno atual. Usa `CommandBody` / `RawBody` / `Body` como alternativa quando não definido.        |
| `BodyForCommands` | Texto limpo usado para analisar diretivas/comandos. Usa `CommandBody` / `RawBody` / `Body` como alternativa quando não definido. |
| `CommandBody`     | Corpo intermediário legado; prefira `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsoleto para `CommandBody`.                                                                         |
| `Body`            | Corpo de prompt legado; pode incluir envelopes de canal e delimitadores de histórico.                                     |

Quando um canal fornece histórico, ele o envolve com:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Em chats não diretos (grupos/canais/salas), o corpo da mensagem atual recebe como prefixo o rótulo do remetente, seguindo o estilo usado nas entradas do histórico. A remoção de diretivas se aplica somente à seção da mensagem atual, portanto o histórico permanece intacto. Os canais que envolvem o histórico devem definir `BodyForCommands` (ou os campos legados `CommandBody` / `RawBody`) com o texto original da mensagem e manter `Body` como o prompt combinado.

Os buffers de histórico contêm somente itens pendentes: incluem mensagens de grupo que não acionaram uma execução (por exemplo, mensagens condicionadas a menção) e excluem mensagens já presentes na transcrição da sessão. Durante a montagem do prompt, históricos estruturados, respostas, encaminhamentos e metadados do canal são renderizados como blocos de contexto não confiáveis com função de usuário.

Configure o tamanho do histórico com `messages.groupChat.historyLimit` (padrão global) ou substituições por canal, como `channels.slack.historyLimit` e `channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Metadados de resultados de ferramentas

O `content` do resultado da ferramenta é o resultado visível ao modelo; `details` contém metadados de runtime para renderização na interface, diagnóstico, entrega de mídia e Plugins.

- `toolResult.details` é removido antes da repetição para o provedor e antes da entrada da Compaction.
- As transcrições de sessão persistidas mantêm apenas `details` limitado; metadados grandes demais são substituídos por um resumo compacto marcado como `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar em `content` o texto que o modelo precisa ler, não apenas em `details`.

## Enfileiramento e acompanhamentos

Quando uma execução já está ativa, por padrão as mensagens de entrada são direcionadas para ela. `messages.queue` controla o modo:

| Modo              | Comportamento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (padrão) | Injeta o novo prompt na execução ativa.          |
| `followup`        | Executa a mensagem depois que a execução ativa termina.      |
| `collect`         | Agrupa mensagens compatíveis em um único turno posterior.      |
| `interrupt`       | Aborta a execução ativa e inicia o prompt mais recente. |

Padrões: `messages.queue.debounceMs` é 500ms (aplica-se igualmente ao direcionamento, ao acompanhamento e ao agrupamento de coleta), `messages.queue.cap` é 20 mensagens enfileiradas e `messages.queue.drop` é `summarize` (`old` e `new` também estão disponíveis). Configure substituições por canal por meio de `messages.queue.byChannel` e `messages.queue.debounceMsByChannel`.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade da execução pelo canal

Os Plugins de canal podem preservar a ordenação, aplicar debounce à entrada e controlar a contrapressão do transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um timeout separado ao próprio turno do agente. Depois que uma mensagem é roteada para uma sessão, os ciclos de vida da sessão, das ferramentas e do runtime regem trabalhos de longa duração, para que todos os canais relatem turnos lentos e se recuperem deles de maneira consistente.

## Streaming, fragmentação e agrupamento

O streaming em blocos envia respostas parciais conforme o modelo produz blocos de texto; a fragmentação respeita os limites de texto do canal e evita dividir código cercado por delimitadores.

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em blocos)
- Substituições de canal: `*.streaming.block.enabled` e `*.streaming.block.coalesce` nos canais incluídos; chaves simples obsoletas são migradas por `openclaw doctor --fix`. O streaming em blocos fica desativado, a menos que seja explicitamente habilitado, em todos os canais, incluindo o Telegram. O QQ Bot é a exceção: ele não tem chaves `streaming.block` e transmite respostas em blocos, a menos que `channels.qqbot.streaming.mode` seja `"off"`.

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando é produzido pelo modelo.
- O Telegram permite transmitir o raciocínio em streaming para um balão de rascunho temporário, que é excluído após a entrega final; use `/reasoning on` para obter uma saída de raciocínio persistente.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, threads e respostas

- Cascata de prefixos de saída: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. O WhatsApp também tem `channels.whatsapp.messagePrefix` para um prefixo de entrada.
- Encadeamento de respostas por meio de `replyToMode` e padrões por canal.

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso `NO_REPLY` (sem diferenciação entre maiúsculas e minúsculas, portanto `no_reply` também corresponde) significa "não entregar uma resposta visível ao usuário". Quando um turno também tem mídia pendente de ferramentas, como áudio de TTS gerado, o OpenClaw remove o texto silencioso, mas ainda entrega o anexo de mídia.

A política de silêncio é determinada pelo tipo de conversa:

- Conversas diretas nunca recebem orientações de prompt de `NO_REPLY`. Se uma execução direta retornar por engano apenas um token silencioso, o OpenClaw o suprime em vez de reescrevê-lo ou entregá-lo.
- Grupos/canais permitem silêncio por padrão. No modo de resposta visível `message_tool`, silêncio significa que o modelo não chama `message(action=send)`.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply`; `surfaces.<id>.silentReply` pode substituir a política de grupo/interna por superfície.

O OpenClaw também usa respostas silenciosas para falhas genéricas do executor interno em chats não diretos, para que grupos/canais não vejam mensagens padronizadas de erro do Gateway. Falhas classificadas com instruções de recuperação voltadas ao usuário, como avisos de autenticação ausente, limite de taxa ou sobrecarga, ainda podem ser entregues. Os chats diretos mostram mensagens de falha compactas por padrão; os detalhes brutos do executor só aparecem quando `/verbose full` está habilitado.

Respostas que contêm apenas o token silencioso são descartadas em todas as superfícies, para que as sessões pai permaneçam silenciosas em vez de reescreverem o texto sentinela como mensagens alternativas.

## Relacionado

- [Refatoração do ciclo de vida das mensagens](/pt-BR/concepts/message-lifecycle-refactor) - projeto-alvo durável para envio e recebimento
- [Streaming](/pt-BR/concepts/streaming) - entrega de mensagens em tempo real
- [Repetição](/pt-BR/concepts/retry) - comportamento de repetição da entrega de mensagens
- [Fila](/pt-BR/concepts/queue) - fila de processamento de mensagens
- [Canais](/pt-BR/channels) - integrações com plataformas de mensagens
