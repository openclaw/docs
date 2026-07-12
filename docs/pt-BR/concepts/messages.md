---
read_when:
    - Explicando como mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-07-12T15:09:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
    source_path: concepts/messages.md
    workflow: 16
---

As mensagens recebidas passam por roteamento, eliminação de duplicatas/debounce, uma execução do agente e entrega de saída:

```text
Mensagem recebida
  -> roteamento/vínculos -> chave da sessão
  -> eliminação de duplicatas + debounce
  -> fila (se uma execução já estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas de saída (limites do canal + divisão em partes)
```

Principais superfícies de configuração:

- `messages.*` para prefixos, enfileiramento, debounce de entrada e comportamento de grupos.
- `agents.defaults.*` para streaming em blocos, divisão em partes e padrões de resposta silenciosa.
- Substituições específicas de canal (`channels.telegram.*`, `channels.whatsapp.*` etc.) para limites e opções de streaming por canal.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Eliminação de duplicatas de entrada

Os canais podem entregar novamente a mesma mensagem após uma reconexão. O OpenClaw mantém um cache em memória indexado pelo escopo do agente, pela rota do canal (canal + par + conta + conversa) e pelo ID da mensagem, para que uma mensagem entregue novamente não acione uma segunda execução do agente. A entrada do cache expira após 20 minutos ou assim que 5000 entradas forem registradas, o que ocorrer primeiro.

## Debounce de entrada

Mensagens de texto consecutivas enviadas rapidamente pelo mesmo remetente podem ser agrupadas em um único turno do agente por meio de `messages.inbound`. O debounce é delimitado por canal + conversa e usa a mensagem mais recente para o encadeamento/IDs da resposta.

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

- O debounce se aplica apenas a mensagens de texto; mídias/anexos são processados imediatamente.
- Comandos de controle (parar/abortar/status etc.) ignoram o debounce para serem despachados imediatamente.
- Desativado por padrão: `messages.inbound.debounceMs` não tem um valor padrão integrado, portanto o debounce só é ativado depois que você o configura (globalmente ou por canal).
- A opção `coalesceSameSenderDms` do iMessage é a única exceção: ela retém todos os textos de mensagens diretas do mesmo remetente (incluindo comandos) por tempo suficiente para que o envio separado de comando+URL da Apple chegue como um único turno. Conversas em grupo são sempre despachadas imediatamente, independentemente dessa configuração.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Os chats diretos são agrupados na chave da sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem ser mapeados para a mesma sessão, mas o histórico não é sincronizado integralmente de volta para todos os clientes. Use um dispositivo principal para conversas longas a fim de evitar contextos divergentes. A interface de controle e a TUI sempre mostram a transcrição da sessão armazenada no Gateway, portanto são a fonte oficial.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Corpos de prompt e contexto do histórico

Os plugins de canal preenchem vários campos de texto no contexto de entrada, do mais ao menos preferido:

| Campo             | Finalidade                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto apresentado ao modelo no turno atual. Quando não definido, usa `CommandBody` / `RawBody` / `Body`.                      |
| `BodyForCommands` | Texto limpo usado para analisar diretivas/comandos. Quando não definido, usa `CommandBody` / `RawBody` / `Body`.              |
| `CommandBody`     | Corpo intermediário legado; prefira `BodyForCommands`.                                                                        |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                                              |
| `Body`            | Corpo de prompt legado; pode incluir envelopes do canal e delimitadores de histórico.                                         |

Quando um canal fornece o histórico, ele o envolve com:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para conversas não diretas (grupos/canais/salas), o corpo da mensagem atual recebe como prefixo o rótulo do remetente, seguindo o estilo usado nas entradas do histórico. A remoção de diretivas aplica-se apenas à seção da mensagem atual, portanto o histórico permanece intacto. Os canais que encapsulam o histórico devem definir `BodyForCommands` (ou os campos legados `CommandBody` / `RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.

Os buffers de histórico contêm apenas itens pendentes: eles incluem mensagens de grupo que não acionaram uma execução (por exemplo, mensagens sujeitas à exigência de menção) e excluem mensagens que já estão na transcrição da sessão. Metadados estruturados de histórico, resposta, encaminhamento e canal são renderizados como blocos de contexto não confiável com a função de usuário durante a montagem do prompt.

Configure o tamanho do histórico com `messages.groupChat.historyLimit` (padrão global) ou com substituições específicas por canal, como `channels.slack.historyLimit` e `channels.telegram.accounts.<id>.historyLimit` (defina como `0` para desativar).

## Metadados de resultado da ferramenta

O `content` do resultado da ferramenta é o resultado visível para o modelo; `details` são metadados de runtime usados para renderização da interface, diagnóstico, entrega de mídia e plugins.

- `toolResult.details` é removido antes da reprodução pelo provedor e antes da entrada de compaction.
- As transcrições de sessão persistidas mantêm apenas `details` dentro dos limites; metadados grandes demais são substituídos por um resumo compacto marcado com `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar o texto que o modelo precisa ler em `content`, não apenas em `details`.

## Enfileiramento e acompanhamentos

Quando uma execução já está ativa, as mensagens recebidas são direcionadas a ela por padrão. `messages.queue` controla o modo:

| Modo              | Comportamento                                            |
| ----------------- | ------------------------------------------------------- |
| `steer` (padrão)  | Injeta o novo prompt na execução ativa.                 |
| `followup`        | Executa a mensagem após o término da execução ativa.    |
| `collect`         | Agrupa mensagens compatíveis em um único turno posterior. |
| `interrupt`       | Interrompe a execução ativa e inicia o prompt mais recente. |

Padrões: `messages.queue.debounceMs` é 500ms (aplica-se igualmente ao agrupamento de steer, followup e collect), `messages.queue.cap` é de 20 mensagens enfileiradas e `messages.queue.drop` é `summarize` (`old` e `new` também estão disponíveis). Configure substituições por canal usando `messages.queue.byChannel` e `messages.queue.debounceMsByChannel`.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade da execução do canal

Os plugins de canal podem preservar a ordem, aplicar debounce à entrada e controlar a contrapressão do transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um tempo limite separado ao próprio turno do agente. Depois que uma mensagem é encaminhada para uma sessão, os ciclos de vida da sessão, das ferramentas e do runtime regem trabalhos de longa duração, para que todos os canais relatem e se recuperem de turnos lentos de maneira consistente.

## Streaming, divisão em blocos e agrupamento

O streaming em blocos envia respostas parciais à medida que o modelo produz blocos de texto; a divisão respeita os limites de texto do canal e evita dividir código cercado por delimitadores.

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em blocos)
- Substituições por canal: `*.streaming.block.enabled` e `*.streaming.block.coalesce` em canais com configuração de streaming aninhada (Telegram, Discord, Slack, iMessage, Microsoft Teams); `*.blockStreaming` / `*.blockStreamingCoalesce` no nível superior em canais sem uma configuração de streaming aninhada. O streaming em blocos fica desativado, a menos que seja explicitamente habilitado, em todos os canais, incluindo o Telegram.

Detalhes: [Streaming + divisão em blocos](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo do raciocínio ainda conta para o uso de tokens quando o modelo o produz.
- O Telegram permite transmitir o raciocínio por streaming para um balão de rascunho temporário, que é excluído após a entrega final; use `/reasoning on` para uma saída de raciocínio persistente.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

- Cascata de prefixos de saída: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. O WhatsApp também tem `channels.whatsapp.messagePrefix` para um prefixo de entrada.
- Encadeamento de respostas por meio de `replyToMode` e padrões por canal.

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso `NO_REPLY` (sem distinção entre maiúsculas e minúsculas, portanto `no_reply` também corresponde) significa "não entregar uma resposta visível ao usuário". Quando um turno também tem mídia de ferramenta pendente, como áudio TTS gerado, o OpenClaw remove o texto silencioso, mas ainda entrega o anexo de mídia.

A política de silêncio é definida pelo tipo de conversa:

- Conversas diretas nunca recebem orientação de prompt sobre `NO_REPLY`. Se uma execução direta retornar acidentalmente apenas um token silencioso, o OpenClaw o suprime em vez de reescrevê-lo ou entregá-lo.
- Grupos/canais permitem silêncio por padrão. No modo de resposta visível `message_tool`, silêncio significa que o modelo não chama `message(action=send)`.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply`; `surfaces.<id>.silentReply` pode substituir a política de grupo/interna por superfície.

O OpenClaw também usa respostas silenciosas para falhas genéricas do executor interno em conversas não diretas, para que grupos/canais não vejam textos padronizados de erro do gateway. Falhas classificadas com texto de recuperação voltado ao usuário, como avisos de autenticação ausente, limite de taxa ou sobrecarga, ainda podem ser entregues. Conversas diretas exibem um texto compacto de falha por padrão; detalhes brutos do executor são exibidos apenas quando `/verbose full` está habilitado.

Respostas contendo apenas o token silencioso são descartadas em todas as superfícies, para que as sessões principais permaneçam silenciosas em vez de reescrever o texto sentinela como conversa de fallback.

## Relacionados

- [Refatoração do ciclo de vida das mensagens](/pt-BR/concepts/message-lifecycle-refactor) - projeto-alvo durável de envio e recebimento
- [Streaming](/pt-BR/concepts/streaming) - entrega de mensagens em tempo real
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa de entrega de mensagens
- [Fila](/pt-BR/concepts/queue) - fila de processamento de mensagens
- [Canais](/pt-BR/channels) - integrações com plataformas de mensagens
