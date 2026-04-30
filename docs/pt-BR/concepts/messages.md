---
read_when:
    - Explicando como as mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de transmissão contínua
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-30T09:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw processa mensagens recebidas por meio de um pipeline de resolução de sessão, enfileiramento, streaming, execução de ferramentas e visibilidade de raciocínio. Esta página mapeia o caminho da mensagem recebida até a resposta.

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
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Deduplicação de recebimento

Canais podem reenviar a mesma mensagem após reconexões. OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/ID da mensagem para que entregas
duplicadas não acionem outra execução do agente.

## Debouncing de recebimento

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em uma única
rodada do agente via `messages.inbound`. O debouncing é escopado por canal + conversa
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
- Comandos de controle ignoram o debouncing para permanecerem independentes — **exceto** quando um canal aceita explicitamente a agregação de DMs do mesmo remetente (por exemplo, [BlueBubbles `coalesceSameSenderDms`](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos de DM aguardam dentro da janela de debounce para que uma carga útil enviada em partes possa entrar na mesma rodada do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Conversas diretas são reduzidas à chave da sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessão e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas
longas para evitar contexto divergente. A Control UI e a TUI sempre mostram a
transcrição da sessão respaldada pelo Gateway, portanto elas são a fonte da verdade.

Detalhes: [Gerenciamento de sessão](/pt-BR/concepts/session).

## Metadados de resultado de ferramenta

O `content` do resultado de ferramenta é o resultado visível para o modelo. O `details` do resultado de ferramenta é
metadado de runtime para renderização na UI, diagnósticos, entrega de mídia e plugins.

OpenClaw mantém esse limite explícito:

- `toolResult.details` é removido antes do replay do provedor e da entrada de Compaction.
- Transcrições de sessão persistidas mantêm apenas `details` limitados; metadados grandes demais
  são substituídos por um resumo compacto marcado com `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar o texto que o modelo precisa ler em `content`, não apenas
  em `details`.

## Corpos de entrada e contexto do histórico

OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes do canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado de `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **conversas não diretas** (grupos/canais/salas), o **corpo da mensagem atual** é prefixado com o
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém mensagens em tempo real e mensagens
enfileiradas/de histórico consistentes no prompt do agente.

Buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que envolvem histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e substituições por canal, como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desabilitar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para uma rodada de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- O modo padrão é `steer`, com um debounce de acompanhamento de 500 ms quando o direcionamento recai
  para entrega de acompanhamento enfileirada.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` e o
  modo legado `queue`, um por vez.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade da execução por canal

Plugins de canal podem preservar a ordenação, aplicar debounce à entrada e aplicar contrapressão
de transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um
timeout separado ao redor da rodada do agente em si. Depois que uma mensagem é roteada para uma
sessão, trabalhos de longa duração são regidos pelo ciclo de vida da sessão, da ferramenta e do runtime,
para que todos os canais relatem e se recuperem de rodadas lentas de forma consistente.

## Streaming, fragmentação e agrupamento

O streaming em blocos envia respostas parciais conforme o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir código cercado.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em blocos)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais que não são Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade de raciocínio e tokens

OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- Telegram oferece suporte a fluxo de raciocínio no balão de rascunho.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens enviadas é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
Quando uma rodada também tem mídia de ferramenta pendente, como áudio TTS gerado, OpenClaw
remove o texto silencioso, mas ainda entrega o anexo de mídia.
OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa isolada para uma alternativa curta visível.
- Grupos/canais permitem silêncio por padrão.
- Orquestração interna permite silêncio por padrão.

OpenClaw também usa respostas silenciosas para falhas internas do executor que acontecem
antes de qualquer resposta do assistente em conversas não diretas, para que grupos/canais não vejam
texto genérico de erro do Gateway. Conversas diretas mostram texto compacto de falha por padrão;
detalhes brutos do executor são mostrados somente quando `/verbose` está `on` ou `full`.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem substituí-los por superfície.

Quando a sessão pai tem uma ou mais execuções pendentes de subagentes gerados, respostas
silenciosas isoladas são descartadas em todas as superfícies em vez de serem reescritas, para que o
pai permaneça silencioso até que o evento de conclusão do filho entregue a resposta real.

## Relacionados

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Nova tentativa](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Fila](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Canais](/pt-BR/channels) — integrações com plataformas de mensagens
