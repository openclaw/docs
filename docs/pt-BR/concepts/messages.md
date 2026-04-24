---
read_when:
    - Explicando como mensagens de entrada se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-24T05:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Esta página reúne como o OpenClaw lida com mensagens de entrada, sessões, enfileiramento,
streaming e visibilidade do raciocínio.

## Fluxo de mensagens (visão geral)

```
Mensagem de entrada
  -> roteamento/vínculos -> chave de sessão
  -> fila (se uma execução estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas de saída (limites do canal + fragmentação)
```

Os principais controles ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento em grupos.
- `agents.defaults.*` para padrões de streaming por blocos e fragmentação.
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuração](/pt-BR/gateway/configuration) para o schema completo.

## Desduplicação de entrada

Canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem para que entregas
duplicadas não acionem outra execução do agente.

## Debouncing de entrada

Mensagens rápidas consecutivas do **mesmo remetente** podem ser agrupadas em um único
turno do agente por meio de `messages.inbound`. O debouncing é restrito por canal + conversa
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

- O debounce se aplica a mensagens **somente de texto**; mídia/anexos são descarregados imediatamente.
- Comandos de controle ignoram o debounce para permanecerem isolados — **exceto** quando um canal opta explicitamente pela coalescência de DMs do mesmo remetente (por exemplo, [BlueBubbles `coalesceSameSenderDms`](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos de DM aguardam dentro da janela de debounce para que uma carga útil enviada em partes possa se unir ao mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao gateway, não aos clientes.

- Chats diretos são reduzidos à chave da sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas longas
para evitar divergência de contexto. A UI de controle e a TUI sempre mostram a
transcrição da sessão sustentada pelo gateway, então elas são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Corpos de entrada e contexto de histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes de canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo do
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém mensagens
em tempo real e em fila/histórico consistentes no prompt do agente.

Buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens controladas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica somente à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Buffers de histórico são configuráveis por `messages.groupChat.historyLimit` (padrão
global) e substituições por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desabilitar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens de entrada podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Enfileiramento](/pt-BR/concepts/queue).

## Streaming, fragmentação e agrupamento

O streaming por blocos envia respostas parciais à medida que o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir código delimitado.

Configurações principais:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento com base em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas por bloco)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para uso de tokens quando produzido pelo modelo.
- O Telegram oferece suporte ao streaming de raciocínio no balão de rascunho.

Detalhes: [Diretivas de thinking + reasoning](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, threads e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa isolada para um fallback curto e visível.
- Grupos/canais permitem silêncio por padrão.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem substituí-los por superfície.

Quando a sessão pai tem uma ou mais execuções pendentes de subagentes iniciados,
respostas silenciosas isoladas são descartadas em todas as superfícies em vez de serem reescritas, para que a
sessão pai permaneça silenciosa até que o evento de conclusão do filho entregue a resposta real.

## Relacionado

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Queue](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Canais](/pt-BR/channels) — integrações com plataformas de mensagens
