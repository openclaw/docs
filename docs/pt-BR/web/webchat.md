---
read_when:
    - Depuração ou configuração do acesso ao WebChat
summary: Host estático do WebChat de loopback e uso de WS do Gateway para interface de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-03T05:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Status: a UI de chat SwiftUI do macOS/iOS conversa diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o Gateway, sem navegador incorporado e sem servidor estático local.
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o Gateway.
2. Abra a UI do WebChat (app macOS/iOS) ou a aba de chat da UI de Controle.
3. Garanta que um caminho válido de autenticação do Gateway esteja configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` segue a ramificação ativa da transcrição para arquivos de sessão modernos somente de acréscimo, então ramificações de reescrita abandonadas e cópias de prompts substituídas não são renderizadas no WebChat.
- Entradas de Compaction são renderizadas como um divisor explícito de histórico compactado. O divisor explica que turnos anteriores são preservados em um checkpoint e vincula aos controles de checkpoint de Sessões, onde operadores podem ramificar ou restaurar a visualização pré-Compaction quando suas permissões permitem.
- A UI de Controle lembra o `sessionId` do Gateway retornado por `chat.history` e o inclui em chamadas seguintes de `chat.send`, então reconexões e atualizações de página continuam a mesma conversa armazenada, a menos que o usuário inicie ou redefina uma sessão.
- A UI de Controle combina envios duplicados em andamento para a mesma sessão, mensagem e anexos antes de gerar um novo id de execução de `chat.send`; o Gateway ainda elimina duplicatas de solicitações repetidas que reutilizam a mesma chave de idempotência.
- `chat.history` também é normalizado para exibição: contexto do OpenClaw somente de runtime,
  wrappers de envelope de entrada, tags inline de diretiva de entrega
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamadas de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos de chamadas de ferramenta truncados), e
  tokens de controle de modelo ASCII/largura total vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta sinalizados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente no WebChat, do texto de reprodução da transcrição e dos blocos de conteúdo de áudio, então payloads apenas de pensamento não aparecem como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a UI (sem execução do agente).
- Execuções abortadas podem manter a saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer, e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no Gateway (sem observação de arquivo local).
- Se o Gateway estiver inacessível, o WebChat fica somente leitura.

## Painel de ferramentas de agentes da UI de Controle

- O painel Ferramentas de `/agents` da UI de Controle tem duas visualizações separadas:
  - **Disponível agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    pode realmente usar em runtime, incluindo ferramentas principais, de Plugin e pertencentes a canais.
  - **Configuração de ferramentas** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica do catálogo.
- A disponibilidade em runtime tem escopo de sessão. Alternar sessões no mesmo agente pode alterar a lista
  **Disponível agora**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência de políticas
  (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto tunela o WebSocket do Gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas de `chat.history`. Quando uma entrada de transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. `maxChars` por solicitação também pode ser enviado pelo cliente para substituir esse padrão em uma única chamada de `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da UI de Controle no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso para clientes de navegador por trás de uma origem de proxy **não loopback** ciente de identidade (consulte [Autenticação de Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino do Gateway remoto.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionado

- [UI de Controle](/pt-BR/web/control-ui)
- [Painel](/pt-BR/web/dashboard)
