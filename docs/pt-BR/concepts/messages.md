---
read_when:
    - Explicando como mensagens de entrada se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-06-27T17:25:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
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
- `agents.defaults.*` para padrões de streaming por blocos e divisão em partes.
- Sobrescrições de canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuração](/pt-BR/gateway/configuration) para ver o esquema completo.

## Deduplicação de entrada

Canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem para que entregas
duplicadas não acionem outra execução do agente.

## Debounce de entrada

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em um único
turno do agente via `messages.inbound`. O debounce tem escopo por canal + conversa
e usa a mensagem mais recente para encadeamento/IDs da resposta.

Configuração (padrão global + sobrescrições por canal):

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

- O debounce se aplica a mensagens **somente de texto**; mídias/anexos são liberados imediatamente.
- Comandos de controle ignoram o debounce para permanecerem independentes. Canais que optam explicitamente por coalescência de DM do mesmo remetente podem manter comandos de DM dentro da janela de debounce para que uma carga enviada em partes possa entrar no mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Conversas diretas são reduzidas à chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas
longas a fim de evitar contexto divergente. A Control UI e o TUI sempre mostram a
transcrição da sessão apoiada pelo Gateway, portanto são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Metadados de resultado de ferramenta

O `content` do resultado da ferramenta é o resultado visível para o modelo. O `details` do resultado da ferramenta é
metadado de runtime para renderização de UI, diagnósticos, entrega de mídia e plugins.

O OpenClaw mantém esse limite explícito:

- `toolResult.details` é removido antes da reprodução pelo provedor e da entrada de Compaction.
- Transcrições persistidas de sessão mantêm apenas `details` limitados; metadados grandes demais
  são substituídos por um resumo compacto marcado como `persistedDetailsTruncated: true`.
- Plugins e ferramentas devem colocar o texto que o modelo deve ler em `content`, não apenas
  em `details`.

## Corpos de entrada e contexto de histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `BodyForAgent`: texto principal voltado ao modelo para a mensagem atual. Plugins de canal
  devem manter isso focado no texto atual do remetente que contém o prompt.
- `Body`: fallback legado de prompt. Isso pode incluir envelopes de canal e
  wrappers opcionais de histórico, mas canais atuais não devem depender dele como a
  entrada principal do modelo quando `BodyForAgent` estiver disponível.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido para compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **conversas não diretas** (grupos/canais/salas), o **corpo da mensagem atual** recebe como prefixo o
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém mensagens em tempo real e enfileiradas/de histórico
consistentes no prompt do agente.

Buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Histórico estruturado, resposta, encaminhamento e metadados de canal são renderizados como
blocos de contexto não confiável no papel de usuário durante a montagem do prompt.
Buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e sobrescrições por canal, como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens de entrada são direcionadas para a execução atual por
padrão. `messages.queue` seleciona se mensagens durante uma execução ativa direcionam, entram na fila para
depois, são coletadas em um turno posterior ou interrompem a execução ativa.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- O modo padrão é `steer`, com debounce de 500 ms para lotes de direcionamento do Codex e
  filas de followup/collect.
- Modos: `steer`, `followup`, `collect` e `interrupt`.

Detalhes: [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Propriedade de execução do canal

Plugins de canal podem preservar ordenação, aplicar debounce à entrada e aplicar contrapressão
de transporte antes que uma mensagem entre na fila da sessão. Eles não devem impor um
timeout separado em torno do turno do agente em si. Depois que uma mensagem é roteada para uma
sessão, trabalho de longa duração é governado pelo ciclo de vida da sessão, da ferramenta e do runtime
para que todos os canais relatem e se recuperem de turnos lentos de forma consistente.

## Streaming, divisão em partes e agrupamento

O streaming por blocos envia respostas parciais conforme o modelo produz blocos de texto.
A divisão em partes respeita limites de texto do canal e evita dividir blocos de código cercados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em ociosidade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em bloco)
- Sobrescrições de canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais que não sejam Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + divisão em partes](/pt-BR/concepts/streaming).

## Visibilidade de raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- Telegram oferece suporte a fluxo de raciocínio em um balão de rascunho transitório que é excluído após a entrega final; use `/reasoning on` para saída persistente de raciocínio.

Detalhes: [Diretivas de pensamento + raciocínio](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de resposta via `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/config-agents#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa "não entregue uma resposta visível ao usuário".
Quando um turno também tem mídia de ferramenta pendente, como áudio TTS gerado, o OpenClaw
remove o texto silencioso, mas ainda entrega o anexo de mídia.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas nunca recebem orientação de prompt `NO_REPLY`. Se uma execução direta
  retornar acidentalmente um token silencioso isolado, o OpenClaw o suprime em vez
  de reescrevê-lo ou entregá-lo.
- Grupos/canais permitem silêncio por padrão apenas para respostas automáticas de grupo.
  No modo de resposta visível `message_tool`, silêncio significa que o modelo não chama
  `message(action=send)`.
- A orquestração interna permite silêncio por padrão.

O OpenClaw também usa respostas silenciosas para falhas genéricas internas de runner em
conversas não diretas, para que grupos/canais não vejam texto padrão de erro do Gateway.
Falhas classificadas com texto de recuperação voltado ao usuário, como autenticação ausente,
limite de taxa ou avisos de sobrecarga, ainda podem ser entregues. Conversas diretas mostram
texto compacto de falha por padrão; detalhes brutos do runner são mostrados apenas quando
`/verbose full` está ativado.

Os padrões ficam em `agents.defaults.silentReply`; `surfaces.<id>.silentReply`
pode sobrescrever a política de grupo/interna por superfície.

Respostas silenciosas isoladas são descartadas em todas as superfícies, então sessões pai permanecem quietas
em vez de reescrever texto sentinela em conversa fallback.

## Relacionado

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) - projeto-alvo durável de envio e recebimento
- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Nova tentativa](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Fila](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Canais](/pt-BR/channels) — integrações com plataformas de mensagens
