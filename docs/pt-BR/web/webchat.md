---
read_when:
    - Depurando ou configurando o acesso ao WebChat
summary: Host estático local loopback do WebChat e uso do WS do Gateway para a UI de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-25T13:59:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Status: a UI nativa de chat em SwiftUI no macOS/iOS se comunica diretamente com o WebSocket do Gateway.

## O que é

- Uma UI nativa de chat para o gateway (sem navegador embutido e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a UI do WebChat (app macOS/iOS) ou a aba de chat do Control UI.
3. Verifique se um caminho válido de autenticação do gateway está configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` também é normalizado para exibição: contexto do OpenClaw somente de runtime,
  wrappers de envelope de entrada, tags inline de diretiva de entrega
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamada de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e
  tokens de controle de modelo vazados em ASCII/largura total são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- `chat.inject` adiciona uma observação do assistente diretamente à transcrição e a transmite para a UI (sem execução de agente).
- Execuções abortadas podem manter saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer, e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado do gateway (sem monitoramento de arquivo local).
- Se o gateway estiver inacessível, o WebChat será somente leitura.

## Painel de ferramentas de agentes no Control UI

- O painel Tools em `/agents` no Control UI tem duas visualizações separadas:
  - **Disponível agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    realmente pode usar em runtime, incluindo ferramentas core, de Plugin e de propriedade do canal.
  - **Configuração da ferramenta** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica de catálogo.
- A disponibilidade em runtime é delimitada por sessão. Alternar sessões no mesmo agente pode mudar a lista de
  **Disponível agora**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência
  de política (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: número máximo de caracteres para campos de texto em respostas de `chat.history`. Quando uma entrada de transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. O cliente também pode enviar `maxChars` por solicitação para substituir esse padrão em uma única chamada `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação do WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat do navegador no Control UI pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **fora de loopback** com reconhecimento de identidade (consulte [Autenticação Trusted Proxy](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino do gateway remoto.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [Painel](/pt-BR/web/dashboard)
