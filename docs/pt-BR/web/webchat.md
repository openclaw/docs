---
read_when:
    - Depuração ou configuração do acesso ao WebChat
summary: Host estático do WebChat de loopback e uso de WS do Gateway para a interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-05-02T05:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: a UI de chat SwiftUI para macOS/iOS conversa diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o Gateway (sem navegador incorporado e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o Gateway.
2. Abra a UI do WebChat (app para macOS/iOS) ou a aba de chat da UI de Controle.
3. Garanta que um caminho válido de autenticação do Gateway esteja configurado (shared-secret por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` segue a ramificação ativa da transcrição em arquivos de sessão modernos somente de acréscimo, então ramificações de reescrita abandonadas e cópias de prompt substituídas não são renderizadas no WebChat.
- A UI de Controle lembra o `sessionId` do Gateway subjacente retornado por `chat.history` e o inclui em chamadas subsequentes de `chat.send`, então reconexões e atualizações de página continuam a mesma conversa armazenada, a menos que o usuário inicie ou redefina uma sessão.
- A UI de Controle consolida envios duplicados em andamento para a mesma sessão, mensagem e anexos antes de gerar um novo id de execução de `chat.send`; o Gateway ainda deduplica solicitações repetidas que reutilizam a mesma chave de idempotência.
- `chat.history` também é normalizado para exibição: contexto OpenClaw apenas de runtime,
  wrappers de envelope de entrada, tags inline de diretiva de entrega
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML em texto simples de chamadas de ferramenta
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e
  tokens de controle de modelo ASCII/largura total vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta marcados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente no WebChat, do texto de replay da transcrição e dos blocos de conteúdo de áudio, então payloads apenas de pensamento não aparecem como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a UI (sem execução de agente).
- Execuções abortadas podem manter saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no Gateway (sem monitoramento de arquivos locais).
- Se o Gateway estiver inacessível, o WebChat fica somente leitura.

## Painel de ferramentas de agentes da UI de Controle

- O painel Ferramentas de `/agents` da UI de Controle tem duas visualizações separadas:
  - **Disponível Agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    realmente pode usar em runtime, incluindo ferramentas do núcleo, de Plugin e pertencentes ao canal.
  - **Configuração de Ferramentas** usa `tools.catalog` e permanece focada em perfis, substituições e
    semântica do catálogo.
- A disponibilidade em runtime é escopada à sessão. Trocar de sessão no mesmo agente pode alterar a lista
  **Disponível Agora**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência de política
  (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do Gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas de `chat.history`. Quando uma entrada de transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. `maxChars` por solicitação também pode ser enviado pelo cliente para substituir esse padrão em uma única chamada de `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por shared-secret.
- `gateway.auth.allowTailscale`: a aba de chat da UI de Controle no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **sem loopback** ciente de identidade (consulte [Autenticação por Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto do Gateway.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionado

- [UI de Controle](/pt-BR/web/control-ui)
- [Painel](/pt-BR/web/dashboard)
