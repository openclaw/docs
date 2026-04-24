---
read_when:
    - Depurando ou configurando o acesso ao WebChat
summary: Host estático do WebChat em loopback e uso de WS do Gateway para a UI de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-24T06:20:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Status: a UI de chat SwiftUI para macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o gateway (sem browser embutido e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a UI do WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Garanta que um caminho válido de autenticação do gateway esteja configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` também é normalizado para exibição: tags inline de diretiva de entrega
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamada de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e
  tokens vazados de controle de modelo em ASCII/largura total são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro seja apenas o token
  silencioso exato `NO_REPLY` / `no_reply` são omitidas.
- `chat.inject` acrescenta uma observação do assistente diretamente ao transcript e a transmite para a UI (sem execução do agente).
- Execuções abortadas podem manter saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico do transcript quando existe saída em buffer e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado a partir do gateway (sem observação de arquivo local).
- Se o gateway estiver inacessível, o WebChat será somente leitura.

## Painel de ferramentas de agentes da Control UI

- O painel Tools em `/agents` da Control UI tem duas visualizações separadas:
  - **Disponíveis agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    realmente pode usar em tempo de execução, incluindo ferramentas core, de Plugin e pertencentes a canal.
  - **Configuração de ferramenta** usa `tools.catalog` e permanece focado em perfis, sobrescritas e
    semântica de catálogo.
- A disponibilidade em tempo de execução é escopada por sessão. Trocar de sessão no mesmo agente pode mudar a
  lista **Disponíveis agora**.
- O editor de configuração não implica disponibilidade em tempo de execução; o acesso efetivo ainda segue a precedência
  de política (`allow`/`deny`, sobrescritas por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do gateway sobre SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas `chat.history`. Quando uma entrada do transcript excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. O cliente também pode enviar `maxChars` por request para sobrescrever esse padrão em uma única chamada `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da Control UI no browser pode usar headers de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de browser atrás de uma origem de proxy **não loopback** com reconhecimento de identidade (consulte [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: alvo do gateway remoto.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionados

- [Control UI](/pt-BR/web/control-ui)
- [Dashboard](/pt-BR/web/dashboard)
