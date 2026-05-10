---
read_when:
    - Explicando como as mensagens de entrada se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de transmissão contínua
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-05-10T19:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw processa mensagens de entrada por meio de um pipeline de resolução de sessão, enfileiramento, streaming, execução de ferramentas e visibilidade de raciocínio. Esta página mapeia o caminho da mensagem de entrada até a resposta.

## Fluxo de mensagens (alto nível)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Os principais controles ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento de grupos.
- `agents.defaults.*` para padrões de streaming de blocos e fragmentação.
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Desduplicação de entrada

Canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/ID da mensagem para que entregas
duplicadas não disparem outra execução do agente.

## Debouncing de entrada

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em um único
turno do agente via `messages.inbound`. O debouncing é escopado por canal + conversa
e usa a mensagem mais recente para encadeamento/IDs de resposta.

Configuração (padrão global + substituições por canal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Observações:

- O debounce se aplica a mensagens **somente de texto**; mídia/anexos são liberados imediatamente.
- Comandos de controle ignoram o debouncing para permanecerem independentes. Canais que optam explicitamente por coalescência de DM do mesmo remetente podem manter comandos de DM dentro da janela de debounce para que uma carga enviada em partes possa entrar no mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Conversas diretas são colapsadas na chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para cada cliente. Recomendação: use um dispositivo principal para conversas
longas a fim de evitar contexto divergente. A interface de controle e a TUI sempre mostram a
transcrição da sessão apoiada pelo Gateway, portanto são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Metadados de resultados de ferramentas

O `content` do resultado da ferramenta é o resultado visível ao modelo. O `details` do resultado da ferramenta é
metadado de runtime para renderização de UI, diagnósticos, entrega de mídia e Plugins.

O OpenClaw mantém esse limite explícito:

- `toolResult.details` é removido antes da reprodução do provedor e da entrada de compaction.
- Transcrições de sessão persistidas mantêm apenas `details` limitados; metadados grandes demais
  são substituídos por um resumo compacto marcado como `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar o texto que o modelo precisa ler em `content`, não apenas
  em `details`.

## Corpos de entrada e contexto do histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `BodyForAgent`: texto principal voltado ao modelo para a mensagem atual. Plugins de canal
  devem mantê-lo focado no texto atual do remetente que contém o prompt.
- `Body`: fallback legado de prompt. Isso pode incluir envelopes de canal e
  wrappers opcionais de histórico, mas os canais atuais não devem depender dele como a
  entrada principal do modelo quando `BodyForAgent` está disponível.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **conversas não diretas** (grupos/canais/salas), o **corpo da mensagem atual** recebe como prefixo o
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém mensagens em tempo real e enfileiradas/de histórico
consistentes no prompt do agente.

Buffers de histórico são **apenas pendentes**: eles incluem mensagens de grupo que _não_
dispararam uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que envolvem histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Histórico estruturado, respostas, encaminhamentos e metadados de canal são renderizados como
blocos de contexto não confiável com papel de usuário durante a montagem do prompt.
Buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e substituições por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens de entrada podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- O modo padrão é `steer`, com um debounce de acompanhamento de 500 ms quando o direcionamento
  recua para entrega de acompanhamento enfileirada.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e o
  modo legado de uma por vez `queue`.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade de execução do canal

Plugins de canal podem preservar ordenação, aplicar debounce à entrada e aplicar contrapressão
de transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um
timeout separado ao redor do próprio turno do agente. Depois que uma mensagem é roteada para uma
sessão, trabalhos de longa duração são governados pelo ciclo de vida da sessão, da ferramenta e do runtime,
para que todos os canais relatem e se recuperem de turnos lentos de forma consistente.

## Streaming, fragmentação e agrupamento

O streaming de blocos envia respostas parciais à medida que o modelo produz blocos de texto.
A fragmentação respeita limites de texto do canal e evita dividir código cercado.

Configurações principais:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em blocos)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais que não são Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade de raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- Telegram oferece suporte a streaming de raciocínio em uma bolha de rascunho transitória que é excluída após a entrega final; use `/reasoning on` para saída de raciocínio persistente.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixos de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa "não entregar uma resposta visível ao usuário".
Quando um turno também tem mídia de ferramenta pendente, como áudio TTS gerado, o OpenClaw
remove o texto silencioso, mas ainda entrega o anexo de mídia.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa isolada para um fallback curto visível.
- Grupos/canais permitem silêncio por padrão.
- Orquestração interna permite silêncio por padrão.

O OpenClaw também usa respostas silenciosas para falhas internas do executor que acontecem
antes de qualquer resposta do assistente em conversas não diretas, para que grupos/canais não vejam
texto padrão de erro do Gateway. Conversas diretas mostram uma cópia compacta da falha por padrão;
detalhes brutos do executor são mostrados apenas quando `/verbose` está `on` ou `full`.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem substituí-los por superfície.

Quando a sessão pai tem uma ou mais execuções pendentes de subagentes gerados, respostas
silenciosas isoladas são descartadas em todas as superfícies em vez de serem reescritas, para que a
sessão pai permaneça silenciosa até que o evento de conclusão do filho entregue a resposta real.

## Relacionado

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design de envio e recebimento duráveis alvo
- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Nova tentativa](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Fila](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Canais](/pt-BR/channels) — integrações com plataformas de mensagens
