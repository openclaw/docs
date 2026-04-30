---
read_when:
    - Explicando como mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de transmissão contínua
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-30T16:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw lida com mensagens recebidas por meio de um pipeline de resolução de sessão, enfileiramento, streaming, execução de ferramentas e visibilidade de raciocínio. Esta página mapeia o caminho da mensagem recebida até a resposta.

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
- `agents.defaults.*` para padrões de streaming em blocos e fragmentação.
- Sobrescritas de canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Deduplicação de recebimento

Canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem para que entregas
duplicadas não acionem outra execução do agente.

## Debounce de recebimento

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em um único
turno do agente por meio de `messages.inbound`. O debounce tem escopo por canal + conversa
e usa a mensagem mais recente para encadeamento/IDs de resposta.

Configuração (padrão global + sobrescritas por canal):

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
- Comandos de controle ignoram o debounce para permanecerem autônomos — **exceto** quando um canal opta explicitamente por coalescência de DM do mesmo remetente (por exemplo, [BlueBubbles `coalesceSameSenderDms`](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos de DM aguardam dentro da janela de debounce para que uma carga útil enviada em partes possa entrar no mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao gateway, não aos clientes.

- Conversas diretas são consolidadas na chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas
longas a fim de evitar contexto divergente. A Control UI e a TUI sempre mostram a
transcrição da sessão respaldada pelo Gateway, portanto são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Metadados de resultado de ferramenta

`content` do resultado da ferramenta é o resultado visível para o modelo. `details` do resultado da ferramenta é
metadado de runtime para renderização de UI, diagnósticos, entrega de mídia e plugins.

O OpenClaw mantém esse limite explícito:

- `toolResult.details` é removido antes de repetição pelo provedor e entrada de Compaction.
- Transcrições de sessão persistidas mantêm apenas `details` limitados; metadados grandes demais
  são substituídos por um resumo compacto marcado como `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar o texto que o modelo precisa ler em `content`, não apenas
  em `details`.

## Corpos recebidos e contexto de histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `BodyForAgent`: texto primário voltado ao modelo para a mensagem atual. Plugins de canal
  devem mantê-lo focado no texto atual do remetente que contém o prompt.
- `Body`: fallback legado de prompt. Ele pode incluir envelopes do canal e
  wrappers opcionais de histórico, mas canais atuais não devem depender dele como
  entrada primária do modelo quando `BodyForAgent` estiver disponível.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado de `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **conversas não diretas** (grupos/canais/salas), o **corpo da mensagem atual** recebe como prefixo o
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém mensagens em tempo real e mensagens enfileiradas/de histórico
consistentes no prompt do agente.

Buffers de histórico são **somente pendentes**: incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens controladas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Histórico estruturado, resposta, encaminhamento e metadados de canal são renderizados como
blocos de contexto não confiável no papel de usuário durante a montagem do prompt.
Buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e sobrescritas por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- O modo padrão é `steer`, com um debounce de acompanhamento de 500 ms quando o direcionamento recai
  para entrega de acompanhamento enfileirada.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e o
  modo legado um-por-vez `queue`.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade da execução do canal

Plugins de canal podem preservar a ordenação, aplicar debounce à entrada e aplicar contrapressão
de transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um
timeout separado em torno do próprio turno do agente. Depois que uma mensagem é roteada para uma
sessão, trabalhos de longa duração são regidos pelo ciclo de vida da sessão, da ferramenta e do runtime,
para que todos os canais relatem e se recuperem de turnos lentos de forma consistente.

## Streaming, fragmentação e agrupamento

Streaming em blocos envia respostas parciais conforme o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir blocos de código cercados.

Configurações principais:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em blocos)
- Sobrescritas de canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais que não sejam Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade de raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- O Telegram oferece suporte a streaming de raciocínio no balão de rascunho.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
Quando um turno também tem mídia de ferramenta pendente, como áudio TTS gerado, o OpenClaw
remove o texto silencioso, mas ainda entrega o anexo de mídia.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa pura para um fallback curto e visível.
- Grupos/canais permitem silêncio por padrão.
- Orquestração interna permite silêncio por padrão.

O OpenClaw também usa respostas silenciosas para falhas internas do executor que acontecem
antes de qualquer resposta do assistente em conversas não diretas, para que grupos/canais não vejam
texto boilerplate de erro do gateway. Conversas diretas mostram texto compacto de falha por padrão;
detalhes brutos do executor são mostrados somente quando `/verbose` está `on` ou `full`.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem sobrescrevê-los por superfície.

Quando a sessão pai tem uma ou mais execuções de subagente geradas pendentes, respostas
silenciosas puras são descartadas em todas as superfícies em vez de serem reescritas, para que o
pai permaneça quieto até que o evento de conclusão do filho entregue a resposta real.

## Relacionados

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Tentativa novamente](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Fila](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Canais](/pt-BR/channels) — integrações com plataformas de mensagens
