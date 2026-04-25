---
read_when:
    - Explicando como as mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-25T18:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

Esta página reúne como o OpenClaw lida com mensagens recebidas, sessões, enfileiramento,
streaming e visibilidade do raciocínio.

## Fluxo de mensagens (visão geral)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Os principais controles ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento de grupos.
- `agents.defaults.*` para os padrões de block streaming e chunking.
- Sobrescritas por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuration](/pt-BR/gateway/configuration) para ver o schema completo.

## Desduplicação de entrada

Os canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem, para que entregas duplicadas
não disparem outra execução do agente.

## Debouncing de entrada

Mensagens rápidas e consecutivas do **mesmo remetente** podem ser agrupadas em um único
turno do agente por meio de `messages.inbound`. O debouncing é aplicado por canal + conversa
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

- O debounce se aplica a mensagens **somente de texto**; mídia/anexos são descarregados imediatamente.
- Comandos de controle ignoram o debouncing para permanecerem independentes — **exceto** quando um canal opta explicitamente por coalescência de DMs do mesmo remetente (por exemplo, [BlueBubbles `coalesceSameSenderDms`](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos em DM aguardam dentro da janela de debounce para que uma carga útil enviada em partes possa se juntar ao mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Chats diretos são consolidados na chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas longas
a fim de evitar contexto divergente. A Control UI e a TUI sempre mostram a transcrição da sessão
mantida pelo Gateway, então elas são a fonte da verdade.

Detalhes: [Session management](/pt-BR/concepts/session).

## Corpos de entrada e contexto do histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes do canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo com o
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém consistentes,
no prompt do agente, as mensagens em tempo real e as mensagens enfileiradas/do histórico.

Os buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
dispararam uma execução (por exemplo, mensagens condicionadas a menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Os buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e por sobrescritas por canal, como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desabilitar).

## Enfileiramento e acompanhamentos

Se já houver uma execução ativa, as mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure por meio de `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Queueing](/pt-BR/concepts/queue).

## Streaming, chunking e batching

O block streaming envia respostas parciais à medida que o modelo produz blocos de texto.
O chunking respeita os limites de texto do canal e evita dividir blocos de código delimitados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa de aparência humana entre respostas em bloco)
- Sobrescritas por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + chunking](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando é produzido pelo modelo.
- Telegram oferece suporte a streaming do raciocínio na bolha de rascunho.

Detalhes: [Thinking + reasoning directives](/pt-BR/tools/thinking) e [Token use](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixos de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuration](/pt-BR/gateway/config-agents#messages) e a documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
Quando um turno também tem mídia de ferramenta pendente, como áudio TTS gerado, o OpenClaw
remove o texto silencioso, mas ainda entrega o anexo de mídia.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa isolada para um fallback curto e visível.
- Grupos/canais permitem silêncio por padrão.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem sobrescrevê-los por superfície.

Quando a sessão pai tem uma ou mais execuções pendentes de subagentes gerados, respostas
silenciosas isoladas são descartadas em todas as superfícies em vez de serem reescritas, para que a
sessão pai permaneça silenciosa até que o evento de conclusão do filho entregue a resposta real.

## Relacionado

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Queue](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Channels](/pt-BR/channels) — integrações com plataformas de mensagens
