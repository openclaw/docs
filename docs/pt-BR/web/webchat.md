---
read_when:
    - Depuração ou configuração do acesso ao WebChat
summary: Hospedagem estática do Loopback WebChat e uso de WS do Gateway para a interface de chat
title: Bate-papo na Web
x-i18n:
    generated_at: "2026-04-30T10:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Status: a interface de chat SwiftUI para macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma interface de chat nativa para o Gateway (sem navegador incorporado e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o Gateway.
2. Abra a interface do WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Garanta que um caminho válido de autenticação do Gateway esteja configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A interface se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` segue a ramificação ativa da transcrição para arquivos de sessão modernos somente de acréscimo, então ramificações de reescrita abandonadas e cópias de prompt substituídas não são renderizadas no WebChat.
- A Control UI combina envios duplicados em andamento para a mesma sessão, mensagem e anexos antes de gerar um novo id de execução de `chat.send`; o Gateway ainda elimina a duplicação de solicitações repetidas que reutilizam a mesma chave de idempotência.
- `chat.history` também é normalizado para exibição: contexto do OpenClaw exclusivo de tempo de execução,
  wrappers de envelope de entrada, tags inline de diretiva de entrega
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamadas de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), e
  tokens de controle de modelo ASCII/largura completa vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta marcados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente no WebChat, do texto de reprodução da transcrição e dos blocos de conteúdo de áudio, para que payloads somente de pensamento não apareçam como mensagens visíveis do assistente ou áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a interface (sem execução de agente).
- Execuções abortadas podem manter a saída parcial do assistente visível na interface.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no Gateway (sem observação de arquivos locais).
- Se o Gateway estiver inacessível, o WebChat fica somente leitura.

## Painel de ferramentas de agentes da Control UI

- O painel Tools da Control UI em `/agents` tem duas visualizações separadas:
  - **Disponível agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    pode realmente usar em tempo de execução, incluindo ferramentas centrais, de Plugin e pertencentes a canais.
  - **Configuração de ferramentas** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica do catálogo.
- A disponibilidade em tempo de execução é escopada à sessão. Trocar sessões no mesmo agente pode alterar a
  lista **Disponível agora**.
- O editor de configuração não implica disponibilidade em tempo de execução; o acesso efetivo ainda segue a precedência
  de políticas (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do Gateway via SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas de `chat.history`. Quando uma entrada de transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. `maxChars` por solicitação também pode ser enviado pelo cliente para substituir esse padrão em uma única chamada de `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da Control UI no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitada.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **não loopback** com reconhecimento de identidade (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino do Gateway remoto.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [Dashboard](/pt-BR/web/dashboard)
