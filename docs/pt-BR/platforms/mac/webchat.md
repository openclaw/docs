---
read_when:
    - Depurando a visualização WebChat do Mac ou a porta de loopback
summary: Como o app para Mac incorpora o WebChat do gateway e como depurá-lo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T06:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

O app de barra de menus do macOS incorpora a UI do WebChat como uma visualização SwiftUI nativa. Ele
se conecta ao Gateway e usa por padrão a **sessão principal** do agente selecionado
(com um seletor de sessão para outras sessões).

- **Modo local**: conecta-se diretamente ao WebSocket do Gateway local.
- **Modo remoto**: encaminha a porta de controle do Gateway por SSH e usa esse
  túnel como plano de dados.

## Inicialização e depuração

- Manual: menu Lobster → “Open Chat”.
- Abertura automática para testes:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Como ele é conectado

- Plano de dados: métodos WS do Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` e eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retorna linhas de transcrição normalizadas para exibição: tags
  de diretivas inline são removidas do texto visível, payloads XML em texto simples
  de chamada de ferramenta (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta) e
  tokens de controle de modelo vazados em ASCII/largura total são removidos, linhas puras do
  assistente com token silencioso, como `NO_REPLY` / `no_reply` exatos, são
  omitidas, e linhas grandes demais podem ser substituídas por placeholders.
- Sessão: usa por padrão a sessão primária (`main`, ou `global` quando o escopo é
  global). A UI pode alternar entre sessões.
- O onboarding usa uma sessão dedicada para manter a configuração da primeira execução separada.

## Superfície de segurança

- O modo remoto encaminha apenas a porta de controle WebSocket do Gateway por SSH.

## Limitações conhecidas

- A UI é otimizada para sessões de chat (não é um sandbox completo de navegador).

## Relacionado

- [WebChat](/pt-BR/web/webchat)
- [App do macOS](/pt-BR/platforms/macos)
