---
read_when:
    - Depurando ou configurando o acesso ao WebChat
summary: Uso do host estático do WebChat em loopback e do WS do Gateway para a interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:40:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Status: a interface nativa de chat SwiftUI no macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma interface nativa de chat para o gateway (sem navegador incorporado e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a interface do WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Garanta que um caminho válido de autenticação do gateway esteja configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A interface se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` também é normalizado para exibição: contexto do OpenClaw somente de runtime,
  wrappers de envelope de entrada, tags de diretiva de entrega inline
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamada de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e
  tokens de controle de modelo ASCII/largura completa vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro seja apenas o token
  silencioso exato `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta marcados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente no WebChat, do texto de reprodução da transcrição e dos blocos de conteúdo de áudio, para que payloads apenas de thinking não apareçam como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a interface (sem execução de agente).
- Execuções abortadas podem manter saída parcial do assistente visível na interface.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no gateway (sem monitoramento de arquivo local).
- Se o gateway estiver inacessível, o WebChat fica somente leitura.

## Painel de ferramentas de agentes da Control UI

- O painel Tools de `/agents` da Control UI tem duas visualizações separadas:
  - **Available Right Now** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    realmente pode usar em runtime, incluindo ferramentas do core, de Plugin e pertencentes ao canal.
  - **Tool Configuration** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica de catálogo.
- A disponibilidade em runtime tem escopo de sessão. Trocar de sessão no mesmo agente pode mudar a
  lista **Available Right Now**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência de política
  (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas `chat.history`. Quando uma entrada da transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. `maxChars` por solicitação também pode ser enviado pelo cliente para substituir esse padrão em uma única chamada `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da Control UI no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **fora de loopback** com reconhecimento de identidade (veja [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino do gateway remoto.
- `session.*`: armazenamento de sessão e padrões de chave principal.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [Dashboard](/pt-BR/web/dashboard)
